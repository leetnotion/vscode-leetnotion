import { leetcodeTreeView } from '@/extension';
import { leetCodeChannel } from '@/leetCodeChannel';
import { LeetnotionTree, ListsWithQuestions } from '@/types';
import { Disposable } from 'vscode';
import * as list from '../commands/list';
import { getSortingStrategy } from '../commands/plugin';
import { globalState } from '../globalState';
import { leetcodeClient } from '../leetCodeClient';
import { leetCodeManager } from '../leetCodeManager';
import {
	Category,
	CompanySortingStrategy,
	defaultProblem,
	IProblem,
	ProblemState,
	SortingStrategy,
	UserStatus,
} from '../shared';
import {
	getCompanyPopularity,
	getCompanyTags,
	getContests,
	getListsWithQuestions,
	getSheets,
	getTopicTags,
} from '../utils/dataUtils';
import { getCompaniesSortingStrategy, shouldHideSolvedProblem } from '../utils/settingUtils';
import { getStaticProblems } from '../utils/staticDataUtils';
import { LeetCodeNode } from './LeetCodeNode';

class ExplorerNodeManager implements Disposable {
	private explorerNodeMap: Map<string, LeetCodeNode> = new Map<string, LeetCodeNode>();
	private dataTree: LeetnotionTree = {};
	private pendingRefresh: Promise<void> | null = null;
	private onTreeChanged: () => void = () => {};

	public setOnTreeChanged(callback: () => void): void {
		this.onTreeChanged = callback;
	}

	public async refreshCache(): Promise<void> {
		if (this.pendingRefresh) {
			leetCodeChannel.appendLine(
				'[refreshCache] Refresh already in progress, skipping duplicate call',
			);
			return this.pendingRefresh;
		}
		this.pendingRefresh = this.doRefreshCache();
		try {
			await this.pendingRefresh;
		} finally {
			this.pendingRefresh = null;
		}
	}

	private buildTree(
		problems: IProblem[],
		topicTags: Record<string, string[]>,
		contests: Record<string, string[]>,
		listsWithQuestions: ListsWithQuestions,
	): void {
		const shouldHideSolved: boolean = shouldHideSolvedProblem();
		const dailyProblem = globalState.getDailyProblem();
		const filtered = problems.filter((item) => !shouldHideSolved || item.state !== ProblemState.AC);

		const newNodeMap = new Map<string, LeetCodeNode>();
		for (const problem of filtered) {
			newNodeMap.set(problem.id, new LeetCodeNode(problem));
		}

		const newDataTree: LeetnotionTree = {
			[Category.All]: filtered.map((problem) => problem.id),
			[Category.Difficulty]: {
				Easy: filtered
					.filter(({ difficulty }) => difficulty === 'Easy')
					.map((problem) => problem.id),
				Medium: filtered
					.filter(({ difficulty }) => difficulty === 'Medium')
					.map((problem) => problem.id),
				Hard: filtered
					.filter(({ difficulty }) => difficulty === 'Hard')
					.map((problem) => problem.id),
			},
			[Category.Tag]: topicTags,
			[Category.Company]: getCompanyTags(),
			[Category.Contests]: contests,
			[Category.Favorite]: filtered
				.filter(({ isFavorite }) => isFavorite)
				.map((problem) => problem.id),
			[Category.Daily]: [dailyProblem],
			[Category.Sheets]: getSheets(),
			[Category.Lists]: listsWithQuestions,
		};

		this.explorerNodeMap.clear();
		this.explorerNodeMap = newNodeMap;
		this.dataTree = newDataTree;
		this.storeLeetCodeNodes();
	}

	private async doRefreshCache(): Promise<void> {
		const refreshStart = Date.now();
		leetCodeChannel.appendLine('[refreshCache] Starting tree refresh...');

		if (leetCodeManager.getStatus() === UserStatus.SignedOut) {
			this.dispose();
			this.onTreeChanged();
			leetCodeChannel.appendLine('[refreshCache] User signed out, cleared tree');
			return;
		}

		// Phase 1: Instant render from cached or static data (no slow API calls)
		let start = Date.now();
		const cachedProblems = globalState.getCachedProblems();
		const phase1Problems = cachedProblems ?? getStaticProblems();
		const topicTags = await getTopicTags(); // returns cached or static, kicks off bg refresh
		const contests = await getContests();
		const listsWithQuestions = await getListsWithQuestions();
		this.buildTree(phase1Problems, topicTags, contests, listsWithQuestions);
		this.onTreeChanged();
		leetCodeChannel.appendLine(
			`[refreshCache] Phase 1: ${cachedProblems ? 'Cached' : 'Static'} tree rendered (${Date.now() - start}ms)`,
		);

		// Phase 2: Fetch real data with user state
		start = Date.now();
		leetCodeChannel.appendLine('[refreshCache] Phase 2: Fetching daily problem...');
		await leetcodeClient.setDailyProblem();
		leetCodeChannel.appendLine(
			`[refreshCache] Phase 2: Fetched daily problem (${Date.now() - start}ms)`,
		);

		start = Date.now();
		leetCodeChannel.appendLine('[refreshCache] Phase 2: Fetching live problems...');
		const liveProblems = await list.listProblems();
		leetCodeChannel.appendLine(
			`[refreshCache] Phase 2: Fetched ${liveProblems.length} problems (${Date.now() - start}ms)`,
		);

		if (liveProblems.length > 0) {
			start = Date.now();
			const freshTopicTags = await getTopicTags();
			this.buildTree(liveProblems, freshTopicTags, contests, listsWithQuestions);
			this.onTreeChanged();
			globalState.setCachedProblems(liveProblems);
			leetCodeChannel.appendLine(
				`[refreshCache] Phase 2: Live tree rendered (${Date.now() - start}ms)`,
			);
		}

		leetCodeChannel.appendLine(
			`[refreshCache] Tree refresh complete (total: ${Date.now() - refreshStart}ms)`,
		);
	}

	public getRootNodes(): LeetCodeNode[] {
		const nodes: LeetCodeNode[] = [];
		for (const category of Object.keys(this.dataTree)) {
			if (this.explorerNodeMap.has(category)) {
				const node = this.explorerNodeMap.get(category);
				nodes.push(node);
			}
		}
		return nodes;
	}

	public getNodeById(id: string): LeetCodeNode | undefined {
		return this.explorerNodeMap.get(id);
	}

	public getChildrenNodesById(id: string): LeetCodeNode[] {
		const data = this.getExplorerDataById(id);
		if (!data) {
			return [];
		}
		if (Array.isArray(data)) {
			return this.applySortingStrategy(this.getProblemNodesByIds(data));
		} else {
			let res: LeetCodeNode[] = [];
			for (const key of Object.keys(data)) {
				if (this.explorerNodeMap.has(`${id}#${key}`)) {
					const node = this.explorerNodeMap.get(`${id}#${key}`);
					res.push(node);
				} else {
					res.push(
						new LeetCodeNode(
							Object.assign({}, defaultProblem, {
								id: `${id}#${key}`,
								name: key,
							}),
							false,
						),
					);
				}
			}
			res = this.applySortingStrategy(res, id);
			return res;
		}
	}

	public dispose(): void {
		this.explorerNodeMap.clear();
		this.dataTree = {};
	}

	public getParentNode(childId: string): LeetCodeNode | undefined {
		if (!childId || childId === '') {
			return undefined;
		}
		const meta = childId.split('#');
		return this.explorerNodeMap.get(meta.slice(0, meta.length - 1).join('#'));
	}

	public getExplorerDataById(id: string) {
		let data = this.dataTree;
		if (!id || id === '') {
			return data;
		}
		const metaInfo: string[] = id.split('#');
		for (const key of metaInfo) {
			if (data[key] === undefined) {
				return null;
			}
			data = data[key];
		}
		return data;
	}

	public getProblemNodesByIds(ids: string[]): LeetCodeNode[] {
		const res: LeetCodeNode[] = [];
		for (const id of ids) {
			const node = this.explorerNodeMap.get(id);
			if (node) {
				res.push(node);
			}
		}
		return res;
	}

	public revealNode(id: string) {
		const node = this.explorerNodeMap.get(id);
		if (node && leetcodeTreeView) {
			leetcodeTreeView.reveal(node, { select: true, focus: true, expand: true });
		}
	}

	private applySortingStrategy(nodes: LeetCodeNode[], id?: string): LeetCodeNode[] {
		if (!id) {
			const strategy: SortingStrategy = getSortingStrategy();
			switch (strategy) {
				case SortingStrategy.AcceptanceRateAsc:
					return nodes.sort(
						(x: LeetCodeNode, y: LeetCodeNode) =>
							Number(x.acceptanceRate) - Number(y.acceptanceRate),
					);
				case SortingStrategy.AcceptanceRateDesc:
					return nodes.sort(
						(x: LeetCodeNode, y: LeetCodeNode) =>
							Number(y.acceptanceRate) - Number(x.acceptanceRate),
					);
				default:
					return nodes;
			}
		}
		if (id === Category.Company) {
			return this.applyCompanySortingStrategy(nodes);
		}
		if (id === Category.Tag || id === Category.Lists) {
			return nodes.sort((a: LeetCodeNode, b: LeetCodeNode) => a.name.localeCompare(b.name));
		}
		return nodes;
	}

	private applyCompanySortingStrategy(nodes: LeetCodeNode[]): LeetCodeNode[] {
		const strategy: CompanySortingStrategy = getCompaniesSortingStrategy();
		switch (strategy) {
			case CompanySortingStrategy.Alphabetical: {
				return nodes.sort((a: LeetCodeNode, b: LeetCodeNode): number =>
					a.name.localeCompare(b.name),
				);
			}
			case CompanySortingStrategy.Popularity: {
				const companyPopularityMapping = getCompanyPopularity();
				return nodes.sort(
					(a: LeetCodeNode, b: LeetCodeNode): number =>
						companyPopularityMapping[b.name] - companyPopularityMapping[a.name],
				);
			}
			default:
				return nodes;
		}
	}

	private storeLeetCodeNodes() {
		function dfs(data, curr, map: Map<string, LeetCodeNode>) {
			if (!data || Array.isArray(data)) {
				return;
			}
			if (typeof data === 'object') {
				for (const key of Object.keys(data)) {
					let id = '';
					if (curr === '') {
						id = key;
					} else {
						id = curr + '#' + key;
					}
					map.set(
						id,
						new LeetCodeNode(
							Object.assign({}, defaultProblem, {
								id,
								name: key,
							}),
							false,
						),
					);
					dfs(data[key], id, map);
				}
			}
		}
		dfs(this.dataTree, '', this.explorerNodeMap);
	}
}

export const explorerNodeManager: ExplorerNodeManager = new ExplorerNodeManager();
