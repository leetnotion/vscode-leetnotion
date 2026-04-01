// Copyright (c) leetnotion. All rights reserved.
// Licensed under the MIT license.

import {
	CategoryProblem,
	Credential,
	JudgeResult,
	LeetCodeAdvanced,
	LeetCodeCLI,
	SolutionArticle,
} from '@leetnotion/leetcode-api';
import axios from 'axios';
import * as he from 'he';
import _ from 'lodash';
import * as vscode from 'vscode';
import { globalState } from './globalState';
import { leetCodeChannel } from './leetCodeChannel';
import { IProblem, ProblemRating, ProblemState } from './shared';
import { LeetcodeProblem, ProblemRatingMap } from './types';
import {
	getProblemRatingMap,
	getQuestionCompanyTags,
	getQuestionTopicTags,
} from './utils/dataUtils';
import { extractCookie } from './utils/toolUtils';
import { DialogType, promptForOpenOutputChannel } from './utils/uiUtils';

class LeetcodeClient {
	public leetcode: LeetCodeAdvanced;
	private cli: LeetCodeCLI;
	private _isSignedIn: boolean;
	private favoriteIdHash: string | null = null;
	private favoriteDebounceTimers: Map<string, NodeJS.Timeout> = new Map();

	public get isSignedIn(): boolean {
		return this._isSignedIn;
	}

	public initialize() {
		const cookie = globalState.getCookie();
		if (cookie) {
			this._isSignedIn = true;
			const credential = new Credential(extractCookie(cookie));
			this.leetcode = new LeetCodeAdvanced(credential);
			this.cli = new LeetCodeCLI(credential);
		} else {
			this._isSignedIn = false;
			this.leetcode = new LeetCodeAdvanced();
			this.cli = new LeetCodeCLI();
		}
	}

	public signOut() {
		this._isSignedIn = false;
		this.leetcode = new LeetCodeAdvanced();
		this.cli = new LeetCodeCLI();
		this.favoriteIdHash = null;
		globalState.update('leetcode-favorite-overrides', undefined);
	}

	private async withSessionRetry<T>(fn: () => Promise<T>): Promise<T> {
		try {
			return await fn();
		} catch (error: any) {
			const errorStr = String(error).toLowerCase();
			if (
				errorStr.includes('401') ||
				errorStr.includes('403') ||
				errorStr.includes('session') ||
				errorStr.includes('login')
			) {
				const choice = await vscode.window.showWarningMessage(
					'LeetCode session expired. Sign in again?',
					'Sign In',
					'Cancel',
				);
				if (choice === 'Sign In') {
					await vscode.commands.executeCommand('leetnotion.signin');
					if (this._isSignedIn) {
						return await fn();
					}
				}
			}
			throw error;
		}
	}

	// TODO: cache the topic tags and invalidate the cache after some time
	public async getTopicTags() {
		return await this.leetcode.topicTags();
	}

	// TODO: cache the titleSlug to question number mapping and invalidate the cache after some time
	public async setTitleSlugQuestionNumberMapping() {
		const mapping = await this.leetcode.getTitleSlugQuestionNumberMapping();
		await globalState.setTitleSlugQuestionNumberMapping(mapping);
	}

	public async collectEasterEgg() {
		if (!this._isSignedIn) return;
		try {
			const isCollected = await this.leetcode.collectEasterEgg();
			if (isCollected) {
				promptForOpenOutputChannel(`Collected Easter Egg 🎉: +10 coins`, DialogType.completed);
			}
		} catch (error) {
			leetCodeChannel.appendLine(`Error collecting Easter Egg: ${error}`);
		}
	}

	public async checkIn() {
		if (!this._isSignedIn) return;
		try {
			const checkedIn = await this.leetcode.checkIn();
			if (checkedIn) {
				promptForOpenOutputChannel(`Checked in: +1 Coin`, DialogType.completed);
			}
		} catch (error) {
			leetCodeChannel.appendLine(`Error checking in: ${error}`);
		}
	}

	public async setDailyProblem() {
		try {
			const todayUTC = new Date().toISOString().slice(0, 10);
			if (globalState.getDailyProblemFetchDate() === todayUTC) {
				return;
			}
			const {
				question: { questionFrontendId },
			} = await this.leetcode.daily();
			await globalState.setDailyProblem(questionFrontendId);
		} catch (error) {
			leetCodeChannel.appendLine(`Error getting daily question: ${error}`);
		}
	}

	public async getNoOfProblems() {
		return await this.leetcode.noOfProblems();
	}

	public async getRecentSubmission() {
		if (!this._isSignedIn) {
			leetCodeChannel.appendLine('Leetcode user not signed in');
			return null;
		}
		return await this.leetcode.recentSubmission();
	}

	public async getLeetcodeProblems(
		progressCallback: (problems: LeetcodeProblem[]) => void = () => {},
	): Promise<LeetcodeProblem[]> {
		try {
			if (!this._isSignedIn) throw new Error(`not-signed-in-to-leetcode`);
			const problems = await this.leetcode.getLeetcodeProblems({ callbackFn: progressCallback });
			const problemTypes = await this.leetcode.getProblemTypes();
			const typedProblems = problems.map((problem) => ({
				...problem,
				type: problemTypes[problem.questionFrontendId],
			}));
			return typedProblems;
		} catch (error) {
			throw new Error(`Error getting leetcode problems: ${error}`);
		}
	}

	public async getLists() {
		try {
			if (!this._isSignedIn) throw new Error(`not-signed-in-to-leetcode`);
			const lists = await this.leetcode.getLists();
			return lists;
		} catch (error) {
			throw new Error(`Error getting leetcode lists: ${error}`);
		}
	}

	public async getQuestionsOfList(slug: string) {
		try {
			if (!this._isSignedIn) throw new Error(`not-signed-in-to-leetcode`);
			const questions = await this.leetcode.getQuestionsOfList(slug);
			return questions;
		} catch (error) {
			throw new Error(`Error getting leetcode questions of list ${slug}: ${error}`);
		}
	}

	public async getProblemRatingsMap(): Promise<ProblemRatingMap> {
		try {
			const { data } = await axios.get(
				'https://zerotrac.github.io/leetcode_problem_rating/data.json',
			);
			const ratingsMap: ProblemRatingMap = {};
			for (const rating of data as ProblemRating[]) {
				rating.Rating = _.floor(rating.Rating);
				ratingsMap[rating.ID.toString()] = rating;
			}

			return ratingsMap;
		} catch (error) {
			throw new Error(`Error getting problem ratings: ${error}`);
		}
	}

	public async getUserInfo(): Promise<{ username: string; isPremium: boolean } | null> {
		if (!this._isSignedIn) return null;
		try {
			const whoami = await this.leetcode.whoami();
			return {
				username: whoami.username,
				isPremium: whoami.isPremium || false,
			};
		} catch (error) {
			leetCodeChannel.appendLine(`Error getting user info: ${error}`);
			return null;
		}
	}

	public async listProblems(): Promise<IProblem[]> {
		let start = Date.now();
		leetCodeChannel.appendLine('[listProblems] Fetching all category problems...');
		const problems: CategoryProblem[] = await this.cli.categoryProblems('all');
		leetCodeChannel.appendLine(
			`[listProblems] Fetched ${problems.length} category problems (${Date.now() - start}ms)`,
		);

		start = Date.now();
		leetCodeChannel.appendLine(
			'[listProblems] Fetching company tags, topic tags, and ratings in parallel...',
		);
		const [questionCompanyTags, questionTopicTags, problemRatingMap] = await Promise.all([
			getQuestionCompanyTags(),
			getQuestionTopicTags(),
			getProblemRatingMap(),
		]);
		leetCodeChannel.appendLine(
			`[listProblems] Fetched company tags, topic tags, and ratings (${Date.now() - start}ms)`,
		);

		start = Date.now();
		const slugToIdMapping: Record<string, string> = {};
		const result = problems
			.map((p): IProblem => {
				const id = String(p.fid);
				const companies = questionCompanyTags[id] || [];
				const tags = questionTopicTags[id] || [];
				const ratingEntry = problemRatingMap ? problemRatingMap[id] : undefined;

				slugToIdMapping[p.slug] = id;

				let state: ProblemState;
				if (p.state === 'ac') {
					state = ProblemState.AC;
				} else if (p.state === 'notac') {
					state = ProblemState.NotAC;
				} else {
					state = ProblemState.Unknown;
				}

				return {
					id,
					name: p.name,
					slug: p.slug,
					difficulty: p.level,
					passRate: `${p.percent.toFixed(2)}%`,
					state,
					isFavorite: this.getFavoriteState(id, p.starred),
					locked: p.locked,
					companies,
					tags,
					rating: ratingEntry ? ratingEntry.Rating : undefined,
					problemIndex: ratingEntry ? ratingEntry.ProblemIndex : undefined,
				};
			})
			.sort((a, b) => Number(a.id) - Number(b.id));
		await globalState.setTitleSlugQuestionNumberMapping(slugToIdMapping);
		leetCodeChannel.appendLine(
			`[listProblems] Mapped and sorted ${result.length} problems (${Date.now() - start}ms)`,
		);
		return result;
	}

	public async getLeetcodeProblemsBySlugs(slugs: string[]): Promise<LeetcodeProblem[]> {
		if (!this._isSignedIn) throw new Error(`not-signed-in-to-leetcode`);
		const problemTypes = await this.leetcode.getProblemTypes();
		const problems: LeetcodeProblem[] = [];
		for (const slug of slugs) {
			try {
				const problem = await this.leetcode.problem(slug);
				problems.push({
					...problem,
					frequency: (problem as any).frequency ?? 0,
					type: problemTypes[problem.questionFrontendId] ?? 'Algorithm',
				} as LeetcodeProblem);
			} catch (error) {
				leetCodeChannel.appendLine(`Failed to fetch problem ${slug}: ${error}`);
			}
		}
		return problems;
	}

	public async getProblemDescription(slug: string): Promise<string> {
		const problem = await this.leetcode.problem(slug);
		return problem.content || '';
	}

	public async getCodeTemplate(
		slug: string,
		language: string,
		showDescriptionInComment: boolean,
	): Promise<string> {
		const problem = await this.leetcode.problem(slug);
		const snippet = problem.codeSnippets?.find((s) => s.langSlug === language);
		const code = snippet ? snippet.code : '';
		const fid = problem.questionFrontendId;
		const commentLine =
			language === 'python' || language === 'python3' || language === 'ruby' || language === 'bash'
				? '#'
				: '//';

		const headerLines = [
			`${commentLine} @lc app=leetcode id=${fid} lang=${language}`,
			`${commentLine}`,
			`${commentLine} [${fid}] ${problem.title}`,
		];

		if (showDescriptionInComment) {
			const rawContent = problem.content || '';
			const textContent = he
				.decode(rawContent.replace(/<\/sup>/g, '').replace(/<sup>/g, '^').replace(/<[^>]+>/g, ''))
				.replace(/\r\n/g, '\n');
			headerLines.push(`${commentLine}`);
			for (const line of textContent.split('\n')) {
				headerLines.push(`${commentLine} ${line}`);
			}
		}

		return [
			...headerLines,
			'',
			`${commentLine} @lc code=start`,
			code,
			`${commentLine} @lc code=end`,
			'',
		].join('\n');
	}

	public async getTopVotedSolution(
		slug: string,
		language?: string,
	): Promise<SolutionArticle | null> {
		leetCodeChannel.appendLine(
			`[getTopVotedSolution] Request: slug=${slug}, language=${language ?? '(any)'}`,
		);
		const result = await this.withSessionRetry(() =>
			this.cli.getTopVotedSolution(slug, language ? [language] : undefined),
		);
		leetCodeChannel.appendLine(
			result
				? `[getTopVotedSolution] Response: title="${result.title}", author=${result.author}, votes=${result.hitCount}`
				: `[getTopVotedSolution] Response: no solution found`,
		);
		return result;
	}

	public async submitCode(
		slug: string,
		lang: string,
		questionId: number,
		typedCode: string,
	): Promise<JudgeResult> {
		return this.withSessionRetry(() => this.cli.submitCode({ slug, lang, questionId, typedCode }));
	}

	public async testCode(
		slug: string,
		lang: string,
		questionId: number,
		typedCode: string,
		dataInput: string,
	): Promise<JudgeResult[]> {
		return this.withSessionRetry(() =>
			this.cli.testCode({ slug, lang, questionId, typedCode, dataInput }),
		);
	}

	/**
	 * Toggle favorite with optimistic UI and debounced API sync.
	 * Returns immediately after updating local state.
	 * The API call is debounced — rapid toggles only send the final state.
	 * If the API call fails, onRevert is called to roll back the UI.
	 */
	public toggleFavorite(
		questionId: string,
		addToFavorite: boolean,
		onRevert?: () => void,
	): void {
		// Persist to globalState immediately
		const favorites = (globalState.get('leetcode-favorite-overrides') as Record<string, boolean>) || {};
		favorites[questionId] = addToFavorite;
		globalState.update('leetcode-favorite-overrides', favorites);

		// Debounce the API call per question — 1.5s after last toggle
		const existing = this.favoriteDebounceTimers.get(questionId);
		if (existing) {
			clearTimeout(existing);
		}
		const timer = setTimeout(() => {
			this.favoriteDebounceTimers.delete(questionId);
			this.syncFavoriteToApi(questionId, addToFavorite, onRevert);
		}, 1500);
		this.favoriteDebounceTimers.set(questionId, timer);
	}

	private async syncFavoriteToApi(
		questionId: string,
		addToFavorite: boolean,
		onRevert?: () => void,
	): Promise<void> {
		try {
			leetCodeChannel.appendLine(
				`Syncing favorite for problem ${questionId}: ${addToFavorite ? 'star' : 'unstar'}`,
			);
			const idHash = await this.getFavoriteIdHash();
			if (!idHash) return;
			if (addToFavorite) {
				await this.cli.star(questionId, idHash);
			} else {
				await this.cli.unstar(questionId, idHash);
			}
		} catch (error) {
			leetCodeChannel.appendLine(`Failed to sync favorite for problem ${questionId}: ${error}`);
			// Revert globalState override
			const favorites = (globalState.get('leetcode-favorite-overrides') as Record<string, boolean>) || {};
			delete favorites[questionId];
			globalState.update('leetcode-favorite-overrides', favorites);
			// Revert UI via callback
			if (onRevert) {
				onRevert();
			}
		}
	}

	private getFavoriteState(questionId: string, apiValue: boolean): boolean {
		const overrides = globalState.get(
			'leetcode-favorite-overrides',
		) as Record<string, boolean> | undefined;
		if (overrides && questionId in overrides) {
			return overrides[questionId];
		}
		return apiValue;
	}

	private async getFavoriteIdHash(): Promise<string | null> {
		if (this.favoriteIdHash) return this.favoriteIdHash;
		try {
			const favorites = await this.cli.getFavorites();
			const allLists = [
				...favorites.favorites.private_favorites,
				...favorites.favorites.public_favorites,
			];
			if (allLists.length === 0) return null;
			this.favoriteIdHash = allLists[0].id_hash;
			return this.favoriteIdHash;
		} catch (error) {
			leetCodeChannel.appendLine(`Failed to get favorite list: ${error}`);
			return null;
		}
	}

	public async deleteCache(): Promise<void> {
		await globalState.deleteLeetCodeCache();
	}
}

export const leetcodeClient: LeetcodeClient = new LeetcodeClient();
