// Copyright (c) leetnotion. All rights reserved.
// Licensed under the MIT license.

import * as fsExtra from 'fs-extra';
import * as path from 'path';
import { explorerNodeManager } from '../explorer/explorerNodeManager';
import { globalState } from '../globalState';
import { leetCodeChannel } from '../leetCodeChannel';
import { leetcodeClient } from '../leetCodeClient';
import {
	CompanyTags,
	Lists,
	ListsWithQuestions,
	Mapping,
	ProblemRatingMap,
	QuestionCompanyTags,
	Sheets,
	TopicTags,
} from '../types';
import { getStaticContests, getStaticRatings, getStaticTopicTags } from './staticDataUtils';
import { sleep } from './toolUtils';

const sheetsPath = '../../data/sheets.json';
const companyTagsPath = '../../data/companyTags.json';
const questionCompanyTagsPath = '../../data/questionCompanyTags.json';

export function getSheets(): Sheets {
	const sheets = fsExtra.readJSONSync(path.join(__dirname, sheetsPath)) as Sheets;
	return sheets;
}

export function getCompanyTags(): CompanyTags {
	const companyTags = fsExtra.readJSONSync(path.join(__dirname, companyTagsPath)) as CompanyTags;
	return companyTags;
}

export function getQuestionCompanyTags(): QuestionCompanyTags {
	return fsExtra.readJSONSync(path.join(__dirname, questionCompanyTagsPath)) as QuestionCompanyTags;
}

export async function getContests(): Promise<Record<string, string[]>> {
	const cached = await globalState.getDisk<Record<string, string[]>>('leetcodeContests');
	if (cached) {
		return cached;
	}
	const staticContests = getStaticContests();
	await globalState.updateDisk('leetcodeContests', staticContests);
	return staticContests;
}

export async function syncContests(): Promise<void> {
	try {
		const contests = await getContests();
		const existingContestNames = new Set(Object.keys(contests));

		// Fetch recent past contests from API
		const { contests: pastContests } = await leetcodeClient.leetcode.getPastContests();

		// Find contests not in our data
		const newContests = pastContests.filter((c) => !existingContestNames.has(c.title));
		if (newContests.length === 0) {
			leetCodeChannel.appendLine('[syncContests] No new contests found.');
			return;
		}

		// Use cached slug → frontend ID mapping
		const slugToId = globalState.getTitleSlugQuestionNumberMapping() ?? {};

		// Fetch questions for each new contest
		const newEntries: Record<string, string[]> = {};
		for (const contest of newContests) {
			try {
				const { questions } = await leetcodeClient.leetcode.getContestQuestions(contest.titleSlug);
				const ids = questions.map((q) => slugToId[q.title_slug]).filter(Boolean);
				if (ids.length > 0) {
					newEntries[contest.title] = ids;
					leetCodeChannel.appendLine(`[syncContests] Added ${contest.title}: ${ids.length} problems`);
				}
			} catch (err) {
				leetCodeChannel.appendLine(`[syncContests] Failed to fetch ${contest.title}: ${err}`);
			}
		}

		if (Object.keys(newEntries).length > 0) {
			const updated = { ...newEntries, ...contests };
			await globalState.updateDisk('leetcodeContests', updated);
			await explorerNodeManager.refreshCache();
			leetCodeChannel.appendLine(`[syncContests] Synced ${Object.keys(newEntries).length} new contest(s).`);
		}
	} catch (error) {
		leetCodeChannel.appendLine(`[syncContests] Failed to sync contests: ${error}`);
	}
}

export async function getTopicTags(): Promise<Record<string, string[]>> {
	const topicTags = {};
	const questionTopicTags = await getQuestionTopicTags();
	for (const problem of Object.keys(questionTopicTags)) {
		const tags = questionTopicTags[problem];
		for (const tag of tags) {
			if (topicTags[tag]) {
				topicTags[tag].push(problem);
			} else {
				topicTags[tag] = [problem];
			}
		}
	}
	return topicTags;
}

export async function getQuestionTopicTags(): Promise<TopicTags> {
	const cached = globalState.getTopicTags();
	if (cached) {
		return cached;
	}
	// Kick off background API fetch to populate cache
	leetcodeClient
		.getTopicTags()
		.then((fresh) => {
			globalState.setTopicTags(fresh);
		})
		.catch((err) => {
			leetCodeChannel.appendLine(`Failed to refresh topic tags: ${err}`);
		});
	// Return static data immediately
	return getStaticTopicTags();
}

export async function refreshTopicTags(): Promise<void> {
	try {
		const fresh = await leetcodeClient.getTopicTags();
		await globalState.setTopicTags(fresh);
		leetCodeChannel.appendLine('[refreshTopicTags] Topic tags updated.');
	} catch (err) {
		leetCodeChannel.appendLine(`[refreshTopicTags] Failed to refresh topic tags: ${err}`);
	}
}

export async function getProblemRatingMap(): Promise<ProblemRatingMap> {
	const cached = globalState.getProblemRatingMap();
	if (cached) {
		return cached;
	}
	// Kick off background API fetch to populate cache
	leetcodeClient
		.getProblemRatingsMap()
		.then((fresh) => {
			globalState.setProblemRatingMap(fresh);
		})
		.catch((err) => {
			leetCodeChannel.appendLine(`Failed to refresh problem ratings: ${err}`);
		});
	// Return static data immediately
	return getStaticRatings();
}

export async function setProblemRatingMap() {
	const problemRatingMap = await leetcodeClient.getProblemRatingsMap();
	await globalState.setProblemRatingMap(problemRatingMap);
}

export function getCompanyPopularity(): Record<string, number> {
	const companyTags = getCompanyTags();
	const companyPoularityMapping: Record<string, number> = {};
	for (const [company, data] of Object.entries(companyTags)) {
		const problems = extractArrayElements(data);
		companyPoularityMapping[company] = problems.length;
	}
	return companyPoularityMapping;
}

export function getTitleSlugPageIdMapping() {
	const questionNumberPageIdMapping = globalState.getQuestionNumberPageIdMapping();
	if (!questionNumberPageIdMapping) {
		throw new Error(`question-number-page-id-mapping-not-found`);
	}
	const titleSlugQuestionNumberMapping = globalState.getTitleSlugQuestionNumberMapping();
	if (!titleSlugQuestionNumberMapping) {
		throw new Error(`title-slug-question-number-mapping-not-found`);
	}
	const mapping: Mapping = {};
	for (const [slug, questionNumber] of Object.entries(titleSlugQuestionNumberMapping)) {
		mapping[slug] = questionNumberPageIdMapping[questionNumber];
	}
	return mapping;
}

export async function getLists(): Promise<Lists> {
	let lists = globalState.getLists();
	if (!lists) {
		lists = await leetcodeClient.getLists();
		globalState.setLists(lists);
	}
	return lists;
}

export async function getListsWithQuestions(): Promise<ListsWithQuestions> {
	const lists = await getLists();
	const listsDetails: ListsWithQuestions = {};
	if (lists) {
		for (const list of lists) {
			if (list.name === 'Favorite') continue;
			const questions = await globalState.getQuestionsOfList(list.slug);
			if (questions.length > 0) {
				listsDetails[list.name] = questions.map((item) => item.questionFrontendId);
			}
		}
	}
	return listsDetails;
}

export async function syncLists() {
	await setLists();
	await setQuestionsOfAllLists();
	globalState.setListsSyncTimestamp(Date.now());
}

export async function syncListsIfNeeded(intervalMs: number) {
	const lastSync = globalState.getListsSyncTimestamp();
	if (lastSync && Date.now() - lastSync < intervalMs) {
		return;
	}
	await syncLists();
}

export async function setLists() {
	const lists = await leetcodeClient.getLists();
	globalState.setLists(lists);
}

export async function setQuestionsOfAllLists() {
	const lists = await getLists();
	for (const { name, slug } of lists) {
		try {
			const questions = await leetcodeClient.getQuestionsOfList(slug);
			await globalState.setQuestionsOfList(questions, slug);
			await explorerNodeManager.updateLists();
			leetCodeChannel.appendLine(`Updated questions of ${name} list`);
			await sleep(1000);
		} catch (error) {
			leetCodeChannel.appendLine(`Failed to update questions of list: ${error}`);
		}
	}
}

export function extractArrayElements(data) {
	let result = [];

	function recurse(value) {
		if (Array.isArray(value)) {
			result.push(...value);
			value.forEach((item) => recurse(item));
		} else if (typeof value === 'object' && value !== null) {
			Object.values(value).forEach((val) => recurse(val));
		}
	}

	recurse(data);
	result = [...new Set(result)];
	return result;
}
