import * as vscode from 'vscode';
import { codeLensController } from './codelens/CodeLensController';
import * as cache from './commands/cache';
import { switchDefaultLanguage } from './commands/language';
import * as plugin from './commands/plugin';
import { withAuth } from './commands/shared';
import * as show from './commands/show';
import * as star from './commands/star';
import * as submit from './commands/submit';
import * as test from './commands/test';
import { explorerNodeManager } from './explorer/explorerNodeManager';
import { LeetCodeNode } from './explorer/LeetCodeNode';
import { leetCodeTreeDataProvider } from './explorer/LeetCodeTreeDataProvider';
import { leetCodeTreeItemDecorationProvider } from './explorer/LeetCodeTreeItemDecorationProvider';
import { leetCodeChannel } from './leetCodeChannel';

import { globalState } from './globalState';
import { leetcodeClient } from './leetCodeClient';
import { leetCodeManager } from './leetCodeManager';
import { leetnotionManager } from './leetnotionManager';
import { templateUpdater } from './modules/leetnotion/template-updater';
import { UserStatus } from './shared';
import { leetCodeStatusBarController } from './statusbar/leetCodeStatusBarController';
import {
	refreshTopicTags,
	setProblemRatingMap,
	syncContests,
	syncLists,
	syncListsIfNeeded,
} from './utils/dataUtils';
import { handleBackgroundError, handleError } from './utils/errorUtils';
import { clearIntervals, repeatAction } from './utils/toolUtils';
import TrackData from './utils/trackingUtils';
import { leetCodePreviewProvider } from './webview/leetCodePreviewProvider';
import { leetCodeSolutionProvider } from './webview/leetCodeSolutionProvider';
import { leetCodeSubmissionProvider } from './webview/leetCodeSubmissionProvider';
import { markdownEngine } from './webview/markdownEngine';

let intervals: NodeJS.Timeout[] = [];
export let leetcodeTreeView: vscode.TreeView<LeetCodeNode> | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	try {
		leetCodeManager.onStatusChanged(async () => {
			leetCodeStatusBarController.updateStatusBar(
				leetCodeManager.getStatus(),
				leetCodeManager.getUser(),
			);
			leetCodeTreeDataProvider.refresh();
			leetcodeClient.initialize();

			const status = leetCodeManager.getStatus();
			if (status === UserStatus.SignedIn && intervals.length === 0) {
				await leetcodeClient.setTitleSlugQuestionNumberMapping();
				startRecurringTasks();
			} else if (status === UserStatus.SignedOut) {
				intervals = clearIntervals(intervals);
			}
		});

		leetCodeTreeDataProvider.initialize(context);
		await globalState.initialize(context);
		leetcodeClient.initialize();
		leetnotionManager.initialize();

		const status = leetCodeManager.getStatus();
		if (status === UserStatus.SignedIn) {
			startRecurringTasks();
		}

		explorerNodeManager.setOnNewProblemsDetected(async (newProblems) => {
			try {
				await refreshTopicTags();
				leetCodeTreeDataProvider.refresh();
				await leetnotionManager.addNewProblemsToNotion(newProblems);
			} catch (error) {
				handleBackgroundError(error, 'process new problems');
			}
		});

		leetcodeClient.setTitleSlugQuestionNumberMapping();
		if (globalState.getNotionIntegrationStatus() === 'pending') {
			leetnotionManager
				.updateNotionInfo()
				.then(async () => {
					await globalState.setNotionIntegrationStatus('done');
					vscode.window.showInformationMessage('Notion integration completed 🎉');
				})
				.catch((error) => {
					handleBackgroundError(error, 'complete pending Notion integration');
				});
		}

		leetcodeTreeView = vscode.window.createTreeView('leetnotionExplorer', {
			treeDataProvider: leetCodeTreeDataProvider,
			showCollapseAll: true,
		});

		context.subscriptions.push(
			leetCodeStatusBarController,
			leetCodeChannel,
			leetCodePreviewProvider,
			leetCodeSubmissionProvider,
			leetCodeSolutionProvider,

			markdownEngine,
			codeLensController,
			explorerNodeManager,
			vscode.window.registerFileDecorationProvider(leetCodeTreeItemDecorationProvider),
			leetcodeTreeView,
			vscode.commands.registerCommand(
				'leetnotion.deleteCache',
				withAuth(() => cache.deleteCache()),
			),
			vscode.commands.registerCommand(
				'leetnotion.refreshData',
				withAuth(() => cache.refreshData()),
			),
			vscode.commands.registerCommand('leetnotion.signin', () => leetCodeManager.signIn()),
			vscode.commands.registerCommand('leetnotion.signout', () => leetCodeManager.signOut()),
			vscode.commands.registerCommand(
				'leetnotion.previewProblem',
				withAuth((node: vscode.Uri) => show.previewProblem(node)),
			),
			vscode.commands.registerCommand(
				'leetnotion.showProblem',
				withAuth((node: LeetCodeNode) => show.showProblem(node)),
			),
			vscode.commands.registerCommand(
				'leetnotion.pickOne',
				withAuth(() => show.pickOne()),
			),
			vscode.commands.registerCommand(
				'leetnotion.searchProblem',
				withAuth(() => show.searchProblem()),
			),
			vscode.commands.registerCommand(
				'leetnotion.searchCompany',
				withAuth(() => show.searchCompany()),
			),
			vscode.commands.registerCommand(
				'leetnotion.searchTag',
				withAuth(() => show.searchTag()),
			),
			vscode.commands.registerCommand(
				'leetnotion.searchSheets',
				withAuth(() => show.searchSheets()),
			),
			vscode.commands.registerCommand(
				'leetnotion.searchContests',
				withAuth(() => show.searchContests()),
			),
			vscode.commands.registerCommand(
				'leetnotion.searchList',
				withAuth(() => show.searchLists()),
			),
			vscode.commands.registerCommand(
				'leetnotion.showSolution',
				withAuth((input: LeetCodeNode | vscode.Uri) => show.showSolution(input)),
			),
			vscode.commands.registerCommand(
				'leetnotion.refreshExplorer',
				withAuth(() => {
					return leetCodeTreeDataProvider.refresh();
				}),
			),
			vscode.commands.registerCommand(
				'leetnotion.syncLists',
				withAuth(async () => {
					try {
						await vscode.window.withProgress(
							{
								location: vscode.ProgressLocation.Notification,
								title: 'Syncing LeetCode lists...',
							},
							async () => {
								await syncLists();
								await leetCodeTreeDataProvider.refresh();
							},
						);
					} catch (error) {
						await handleError(error, 'sync lists');
					}
				}),
			),
			vscode.commands.registerCommand(
				'leetnotion.testSolution',
				withAuth((uri?: vscode.Uri) => {
					TrackData.report({
						event_key: `vscode_runCode`,
						type: 'click',
						extra: JSON.stringify({
							path: uri?.path,
						}),
					});
					return test.testSolution(uri);
				}),
			),
			vscode.commands.registerCommand(
				'leetnotion.submitSolution',
				withAuth((uri?: vscode.Uri) => {
					TrackData.report({
						event_key: `vscode_submit`,
						type: 'click',
						extra: JSON.stringify({
							path: uri?.path,
						}),
					});
					return submit.submitSolution(uri);
				}),
			),
			vscode.commands.registerCommand('leetnotion.switchDefaultLanguage', () =>
				switchDefaultLanguage(),
			),
			vscode.commands.registerCommand(
				'leetnotion.addFavorite',
				withAuth((node: LeetCodeNode) => star.addFavorite(node)),
			),
			vscode.commands.registerCommand(
				'leetnotion.removeFavorite',
				withAuth((node: LeetCodeNode) => star.removeFavorite(node)),
			),
			vscode.commands.registerCommand('leetnotion.problems.sort', () =>
				plugin.switchSortingStrategy(),
			),
			vscode.commands.registerCommand('leetnotion.clearAllData', () =>
				leetnotionManager.clearAllData(),
			),
			vscode.commands.registerCommand(
				'leetnotion.updateTemplateInfo',
				withAuth(() => leetnotionManager.updateNotionInfo()),
			),
			vscode.commands.registerCommand(
				'leetnotion.integrateNotion',
				withAuth(() => leetnotionManager.enableNotionIntegration()),
			),
			vscode.commands.registerCommand(
				'leetnotion.updateTemplate',
				withAuth(() => templateUpdater.updateTemplate()),
			),
			vscode.commands.registerCommand(
				'leetnotion.addSubmissions',
				withAuth(() => leetnotionManager.uploadSubmissions()),
			),
			{
				dispose: () => {
					intervals = clearIntervals(intervals);
				},
			},
		);

		await leetCodeManager.getLoginStatus();
		vscode.window.registerUriHandler({ handleUri: leetCodeManager.handleUriSignIn });
	} catch (error) {
		await handleError(error, 'initialize extension');
	}
}

export function deactivate(): void {
	intervals = clearIntervals(intervals);
}

function startRecurringTasks() {
	intervals.push(
		repeatAction(
			async () => {
				try {
					await Promise.all([
						leetcodeClient.checkIn(),
						leetcodeClient.collectEasterEgg(),
						leetcodeClient.setDailyProblem(),
						leetnotionManager.syncUserQuestionTags(),
					]);
					leetCodeTreeDataProvider.refresh();
				} catch (error) {
					handleBackgroundError(error, '30-min interval tasks');
				}
			},
			1000 * 60 * 30,
		),
	);

	const twoHoursMs = 1000 * 60 * 60 * 2;
	intervals.push(
		repeatAction(async () => {
			try {
				await Promise.all([syncListsIfNeeded(twoHoursMs), setProblemRatingMap(), syncContests()]);
				leetCodeTreeDataProvider.refresh();
			} catch (error) {
				handleBackgroundError(error, '2-hour interval tasks');
			}
		}, twoHoursMs),
	);
}
