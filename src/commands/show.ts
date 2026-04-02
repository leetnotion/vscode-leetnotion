import { CompanyTags, Lists, Sheets, TopicTags } from '@/types';
import {
	extractArrayElements,
	getCompanyTags,
	getContests,
	getLists,
	getSheets,
	getTopicTags,
} from '@/utils/dataUtils';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as vscode from 'vscode';
import { explorerNodeManager } from '../explorer/explorerNodeManager';
import { LeetCodeNode } from '../explorer/LeetCodeNode';
import { globalState } from '../globalState';
import { leetCodeChannel } from '../leetCodeChannel';
import { leetcodeClient } from '../leetCodeClient';
import {
	ALL_TIME,
	Category,
	Endpoint,
	IProblem,
	IQuickItemEx,
	languages,
	PREMIUM_URL_CN,
	PREMIUM_URL_GLOBAL,
	ProblemState,
} from '../shared';
import { handleError } from '../utils/errorUtils';
import { genFileExt, genFileName, getNodeIdFromFile } from '../utils/problemUtils';
import * as settingUtils from '../utils/settingUtils';
import { getCodeFooter, getCodeHeader, IDescriptionConfiguration } from '../utils/settingUtils';
import TrackData from '../utils/trackingUtils';
import { DialogOptions, openSettingsEditor, openUrl, promptHintMessage } from '../utils/uiUtils';
import { getActiveFilePath, selectWorkspaceFolder } from '../utils/workspaceUtils';
import { leetCodePreviewProvider } from '../webview/leetCodePreviewProvider';
import { leetCodeSolutionProvider } from '../webview/leetCodeSolutionProvider';
import * as list from './list';
import { getLeetCodeEndpoint } from './plugin';

export async function previewProblem(
	input: IProblem | vscode.Uri,
	isSideMode: boolean = false,
): Promise<void> {
	let node: IProblem;

	if (input instanceof vscode.Uri) {
		const activeFilePath: string = input.fsPath;
		const id: string = await getNodeIdFromFile(activeFilePath);
		if (!id) {
			vscode.window.showErrorMessage(
				`Failed to resolve the problem id from file: ${activeFilePath}.`,
			);
			return;
		}
		const cachedNode: IProblem | undefined = explorerNodeManager.getNodeById(id);
		if (!cachedNode) {
			vscode.window.showErrorMessage(`Failed to resolve the problem with id: ${id}.`);
			return;
		}
		node = cachedNode;
		// Move the preview page aside if it's triggered from Code Lens
		isSideMode = true;
	} else {
		node = input;
		const { isPremium } = globalState.getUserStatus() ?? {};
		if (input.locked && !isPremium) {
			const url = getLeetCodeEndpoint() === Endpoint.LeetCode ? PREMIUM_URL_GLOBAL : PREMIUM_URL_CN;
			openUrl(url);
			return;
		}
	}

	TrackData.report({
		event_key: `vscode_open_problem`,
		type: 'click',
		extra: JSON.stringify({
			problem_id: node.id,
			problem_name: node.name,
		}),
	});

	try {
		const totalStart = Date.now();

		const apiStart = Date.now();
		const problem = await leetcodeClient.leetcode.getQuestionDetailsByTitleSlug(node.slug);
		const apiTime = Date.now() - apiStart;
		leetCodeChannel.appendLine(`[${node.id}] ${node.name}: API call took ${apiTime}ms`);

		leetCodePreviewProvider.show(problem, node, isSideMode);

		const totalTime = Date.now() - totalStart;
		leetCodeChannel.appendLine(
			`[${node.id}] ${node.name}: Total time to show problem ${totalTime}ms (API: ${apiTime}ms, Render: ${totalTime - apiTime}ms)`,
		);
	} catch (error) {
		await handleError(error, 'preview the problem');
	}
}

export async function pickOne(): Promise<void> {
	try {
		const problems: IProblem[] = await list.listProblems();
		const randomProblem: IProblem = problems[Math.floor(Math.random() * problems.length)];
		await showProblemInternal(randomProblem);
	} catch (error) {
		await handleError(error, 'pick a random problem');
	}
}

export async function showProblem(node?: LeetCodeNode): Promise<void> {
	if (!node) {
		return;
	}
	await showProblemInternal(node);
}

export async function searchProblem(): Promise<void> {
	try {
		const choice: IQuickItemEx<IProblem> | undefined = await vscode.window.showQuickPick(
			parseProblemsToPicks(list.listProblems()),
			{
				matchOnDetail: true,
				placeHolder: 'Select one problem',
			},
		);
		if (!choice) {
			return;
		}
		await showProblemInternal(choice.value);
	} catch (error) {
		await handleError(error, 'search problems');
	}
}

export async function searchCompany(): Promise<void> {
	const companyTags = getCompanyTags();
	const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(
		parseCompaniesToPicks(companyTags),
		{
			matchOnDetail: true,
			placeHolder: 'Select one company',
		},
	);
	if (!choice) {
		return;
	}
	explorerNodeManager.revealNode(`${Category.Company}#${choice.value}`);
}

export async function searchTag(): Promise<void> {
	try {
		const topicTags = await getTopicTags();
		const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(
			parseTagsToPicks(topicTags),
			{
				matchOnDetail: true,
				placeHolder: 'Search for a tag',
			},
		);
		if (!choice) {
			return;
		}
		explorerNodeManager.revealNode(`${Category.Tag}#${choice.value}`);
	} catch (error) {
		await handleError(error, 'search tags');
	}
}

export async function searchContests(): Promise<void> {
	const contests = getContests();
	if (!contests || Object.keys(contests).length === 0) {
		leetCodeChannel.appendLine('Failed to get leetcode contests');
		return;
	}
	const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(
		parseContestsToPicks(contests),
		{
			matchOnDetail: true,
			placeHolder: 'Search for a contest',
		},
	);
	if (!choice) {
		return;
	}
	explorerNodeManager.revealNode(`${Category.Contests}#${choice.value}`);
}

export async function searchSheets(): Promise<void> {
	const sheets = getSheets();
	const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(
		parseSheetsToPicks(sheets),
		{
			matchOnDetail: true,
			placeHolder: 'Search for a sheet',
		},
	);
	if (!choice) {
		return;
	}
	explorerNodeManager.revealNode(`${Category.Sheets}#${choice.value}`);
}

export async function searchLists(): Promise<void> {
	try {
		const lists = await getLists();
		const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(
			parseListsToPicks(lists),
			{
				matchOnDetail: true,
				placeHolder: 'Search for a list',
			},
		);
		if (!choice) {
			return;
		}
		explorerNodeManager.revealNode(`${Category.Lists}#${choice.value}`);
	} catch (error) {
		await handleError(error, 'search lists');
	}
}

export async function showSolution(input?: LeetCodeNode | vscode.Uri): Promise<void> {
	const language: string | undefined = await fetchProblemLanguage();
	if (!language) {
		return;
	}
	try {
		let problemId: string | undefined;
		let problemSlug: string | undefined;

		if (input instanceof LeetCodeNode) {
			problemId = input.id;
			problemSlug = input.slug;
		} else {
			// Triggered from Code Lens/context menu (Uri) or command palette (no input)
			const filePath = input instanceof vscode.Uri ? input.fsPath : await getActiveFilePath();
			if (filePath) {
				const nodeId = await getNodeIdFromFile(filePath);
				const node = explorerNodeManager.getNodeById(nodeId);
				problemId = node?.id;
				problemSlug = node?.slug;
			}
		}

		if (!problemId || !problemSlug) {
			vscode.window.showErrorMessage('Could not determine problem for solution lookup.');
			return;
		}

		let solution = await leetcodeClient.getTopVotedSolution(problemSlug, language);
		let solutionLang = language;
		if (!solution) {
			const tryAnyLang = 'Check in Other Language';
			const choice = await vscode.window.showErrorMessage(
				'No solution found for this problem and language.',
				tryAnyLang,
			);
			if (choice !== tryAnyLang) {
				return;
			}
			solution = await leetcodeClient.getTopVotedSolution(problemSlug);
			if (!solution) {
				vscode.window.showErrorMessage('No solution found for this problem in any language.');
				return;
			}
			solutionLang = '';
		}

		let url = `https://leetcode.com/problems/${problemSlug}/solutions/${solution.topicId}/${solution.slug}`;

		leetCodeSolutionProvider.show({
			title: solution.title,
			url,
			avatar: solution.author.userAvatar,
			authorName: solution.author.realName,
			authorUsername: solution.author.userName,
			views: solution.hitCount,
			createdAt: solution.createdAt,
			tags: solution.tags.map((tag) => tag.name),
			content: solution.content.replace(/\\n/g, '\n'),
			votes: String(solution.reactions[0].count || 0),
			lang: solutionLang,
		});
	} catch (error) {
		await handleError(error, 'fetch the top voted solution');
	}
}

async function fetchProblemLanguage(): Promise<string | undefined> {
	const leetCodeConfig: vscode.WorkspaceConfiguration =
		vscode.workspace.getConfiguration('leetnotion');
	let defaultLanguage: string | undefined = leetCodeConfig.get<string>('defaultLanguage');
	if (defaultLanguage && languages.indexOf(defaultLanguage) < 0) {
		defaultLanguage = undefined;
	}
	const language: string | undefined =
		defaultLanguage ||
		(await vscode.window.showQuickPick(languages, {
			placeHolder: 'Select the language you want to use',
			ignoreFocusOut: true,
		}));
	// fire-and-forget default language query
	(async (): Promise<void> => {
		if (language && !defaultLanguage && leetCodeConfig.get<boolean>('hint.setDefaultLanguage')) {
			const choice: vscode.MessageItem | undefined = await vscode.window.showInformationMessage(
				`Would you like to set '${language}' as your default language?`,
				DialogOptions.yes,
				DialogOptions.no,
				DialogOptions.never,
			);
			if (choice === DialogOptions.yes) {
				leetCodeConfig.update('defaultLanguage', language, true /* UserSetting */);
			} else if (choice === DialogOptions.never) {
				leetCodeConfig.update('hint.setDefaultLanguage', false, true /* UserSetting */);
			}
		}
	})();
	return language;
}

async function showProblemInternal(node: IProblem): Promise<void> {
	try {
		const isDatabaseLanguage = node.tags.indexOf('Database') >= 0;
		let language: string | undefined;
		if (isDatabaseLanguage) {
			language = 'mysql';
		} else {
			language = await fetchProblemLanguage();
		}
		if (!language) {
			return;
		}

		const leetCodeConfig: vscode.WorkspaceConfiguration =
			vscode.workspace.getConfiguration('leetnotion');
		const workspaceFolder: string = await selectWorkspaceFolder();
		if (!workspaceFolder) {
			return;
		}

		const fileFolder: string = leetCodeConfig
			.get<string>(
				`filePath.${language}.folder`,
				leetCodeConfig.get<string>(`filePath.default.folder`, ''),
			)
			.trim();
		const fileName: string = leetCodeConfig
			.get<string>(
				`filePath.${language}.filename`,
				leetCodeConfig.get<string>(`filePath.default.filename`) || genFileName(node, language),
			)
			.trim();

		let finalPath: string = path.join(workspaceFolder, fileFolder, fileName);

		if (finalPath) {
			finalPath = await resolveRelativePath(finalPath, node, language);
			if (!finalPath) {
				leetCodeChannel.appendLine('Showing problem canceled by user.');
				return;
			}
		}

		const descriptionConfig: IDescriptionConfiguration = settingUtils.getDescriptionConfiguration();

		if (!(await fse.pathExists(finalPath))) {
			await fse.createFile(finalPath);
			const codeTemplate = await leetcodeClient.getCodeTemplate(
				node.slug,
				language,
				descriptionConfig.showInComment,
			);
			const codeHeader: string = getCodeHeader(language);
			const codeFooter: string = getCodeFooter(language);
			await fse.writeFile(finalPath, codeHeader + codeTemplate + codeFooter);
		}
		const promises: any[] = [
			vscode.window.showTextDocument(vscode.Uri.file(finalPath), {
				preview: false,
				viewColumn: vscode.ViewColumn.One,
			}),
			promptHintMessage(
				'hint.commentDescription',
				'You can config how to show the problem description through "leetnotion.showDescription".',
				'Open settings',
				(): Promise<any> => openSettingsEditor('leetnotion.showDescription'),
			),
		];
		if (descriptionConfig.showInWebview) {
			promises.push(showDescriptionView(node));
		}

		await Promise.all(promises);
	} catch (error) {
		await handleError(error, 'show the problem');
	}
}

async function showDescriptionView(node: IProblem): Promise<void> {
	return previewProblem(
		node,
		vscode.workspace.getConfiguration('leetnotion').get<boolean>('enableSideMode', true),
	);
}
async function parseProblemsToPicks(
	p: Promise<IProblem[]>,
): Promise<Array<IQuickItemEx<IProblem>>> {
	return new Promise(
		async (resolve: (res: Array<IQuickItemEx<IProblem>>) => void): Promise<void> => {
			const picks: Array<IQuickItemEx<IProblem>> = (await p).map((problem: IProblem) =>
				Object.assign(
					{},
					{
						label: `${parseProblemDecorator(problem.state, problem.locked)}${problem.id}.${problem.name}`,
						description: '',
						detail: `AC rate: ${problem.passRate}, Difficulty: ${problem.difficulty}`,
						value: problem,
					},
				),
			);
			resolve(picks);
		},
	);
}

async function parseCompaniesToPicks(companyTags: CompanyTags) {
	const lenMap = {};
	Object.keys(companyTags).forEach((key) => {
		lenMap[key] = companyTags[key][ALL_TIME]
			? companyTags[key][ALL_TIME].length
			: (companyTags[key] as string[]).length;
	});
	const picks: Array<IQuickItemEx<string>> = Object.keys(companyTags)
		.sort((a, b) => lenMap[b] - lenMap[a])
		.map((company: string) =>
			Object.assign(
				{},
				{
					label: company,
					description: '',
					detail: `No of Problems: ${companyTags[company][ALL_TIME] ? companyTags[company][ALL_TIME].length : (companyTags[company] as string[]).length}`,
					value: company,
				},
			),
		);
	return picks;
}

async function parseSheetsToPicks(sheets: Sheets) {
	const picks: Array<IQuickItemEx<string>> = Object.keys(sheets).map((sheet: string) =>
		Object.assign(
			{},
			{
				label: sheet,
				description: '',
				detail: `No of Problems: ${extractArrayElements(sheets[sheet]).length}`,
				value: sheet,
			},
		),
	);
	return picks;
}

async function parseContestsToPicks(contests: Record<string, string[]>) {
	const picks: Array<IQuickItemEx<string>> = Object.keys(contests).map((contest: string) =>
		Object.assign(
			{},
			{
				label: contest,
				description: '',
				detail: `No of Problems: ${extractArrayElements(contests[contest]).length}`,
				value: contest,
			},
		),
	);
	return picks;
}

async function parseTagsToPicks(tags: TopicTags) {
	const picks: Array<IQuickItemEx<string>> = Object.keys(tags).map((tag: string) =>
		Object.assign(
			{},
			{
				label: tag,
				description: '',
				detail: `No of Problems: ${tags[tag].length}`,
				value: tag,
			},
		),
	);
	return picks;
}

async function parseListsToPicks(lists: Lists) {
	const picks: Array<IQuickItemEx<string>> = lists.map((list) =>
		Object.assign(
			{},
			{
				label: list.name,
				description: '',
				value: list.name,
			},
		),
	);
	return picks;
}

function parseProblemDecorator(state: ProblemState, locked: boolean): string {
	switch (state) {
		case ProblemState.AC:
			return '$(check) ';
		case ProblemState.NotAC:
			return '$(x) ';
		default:
			return locked ? '$(lock) ' : '';
	}
}

async function resolveRelativePath(
	relativePath: string,
	node: IProblem,
	selectedLanguage: string,
): Promise<string> {
	let tag: string = '';
	if (/\$\{tag\}/i.test(relativePath)) {
		tag = (await resolveTagForProblem(node)) || '';
	}

	let company: string = '';
	if (/\$\{company\}/i.test(relativePath)) {
		company = (await resolveCompanyForProblem(node)) || '';
	}

	return relativePath.replace(/\$\{(.*?)\}/g, (_substring: string, ...args: string[]) => {
		const placeholder: string = args[0].toLowerCase().trim();
		switch (placeholder) {
			case 'id':
				return node.id;
			case 'name':
				return node.name;
			case 'camelcasename':
				return _.camelCase(node.name);
			case 'pascalcasename':
				return _.upperFirst(_.camelCase(node.name));
			case 'kebabcasename':
			case 'kebab-case-name':
				return node.slug;
			case 'snakecasename':
			case 'snake_case_name':
				return _.snakeCase(node.name);
			case 'ext':
				return genFileExt(selectedLanguage);
			case 'language':
				return selectedLanguage;
			case 'difficulty':
				return node.difficulty.toLocaleLowerCase();
			case 'tag':
				return tag;
			case 'company':
				return company;
			default:
				const errorMsg: string = `The config '${placeholder}' is not supported.`;
				leetCodeChannel.appendLine(errorMsg);
				throw new Error(errorMsg);
		}
	});
}

async function resolveTagForProblem(problem: IProblem): Promise<string | undefined> {
	if (problem.tags.length === 1) {
		return problem.tags[0];
	}
	return await vscode.window.showQuickPick(problem.tags, {
		matchOnDetail: true,
		placeHolder: 'Multiple tags available, please select one',
		ignoreFocusOut: true,
	});
}

async function resolveCompanyForProblem(problem: IProblem): Promise<string | undefined> {
	if (problem.companies.length === 1) {
		return problem.companies[0];
	}
	return await vscode.window.showQuickPick(problem.companies, {
		matchOnDetail: true,
		placeHolder: 'Multiple tags available, please select one',
		ignoreFocusOut: true,
	});
}
