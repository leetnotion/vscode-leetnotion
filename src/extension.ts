// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { codeLensController } from "./codelens/CodeLensController";
import * as cache from "./commands/cache";
import { switchDefaultLanguage } from "./commands/language";
import * as plugin from "./commands/plugin";
import * as show from "./commands/show";
import * as star from "./commands/star";
import * as submit from "./commands/submit";
import * as test from "./commands/test";
import { explorerNodeManager } from "./explorer/explorerNodeManager";
import { LeetCodeNode } from "./explorer/LeetCodeNode";
import { leetCodeTreeDataProvider } from "./explorer/LeetCodeTreeDataProvider";
import { leetCodeTreeItemDecorationProvider } from "./explorer/LeetCodeTreeItemDecorationProvider";
import { leetCodeChannel } from "./leetCodeChannel";
import { leetCodeExecutor } from "./leetCodeExecutor";
import { leetCodeManager } from "./leetCodeManager";
import { leetCodeStatusBarController } from "./statusbar/leetCodeStatusBarController";
import { DialogType, promptForOpenOutputChannel } from "./utils/uiUtils";
import { leetCodePreviewProvider } from "./webview/leetCodePreviewProvider";
import { leetCodeSolutionProvider } from "./webview/leetCodeSolutionProvider";
import { leetCodeSubmissionProvider } from "./webview/leetCodeSubmissionProvider";
import { markdownEngine } from "./webview/markdownEngine";
import TrackData from "./utils/trackingUtils";
import { globalState } from "./globalState";
import { leetcodeClient } from "./leetCodeClient";
import { clearIntervals, repeatAction } from "./utils/toolUtils";
import { leetnotionManager } from "./leetnotionManager";
import { leetnotionClient } from "./leetnotionClient";
import { templateUpdater } from "./modules/leetnotion/template-updater";
import { setLists, setProblemRatingMap, setQuestionsOfAllLists } from "./utils/dataUtils";
import { UserStatus } from "./shared";

let intervals: NodeJS.Timeout[] = [];
export let leetcodeTreeView: vscode.TreeView<LeetCodeNode> | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    try {
        if (!(await leetCodeExecutor.meetRequirements(context))) {
            throw new Error("The environment doesn't meet requirements.");
        }

        leetCodeManager.on("statusChanged", () => {
            leetCodeStatusBarController.updateStatusBar(leetCodeManager.getStatus(), leetCodeManager.getUser());
            leetCodeTreeDataProvider.refresh();
            leetcodeClient.initialize();

            const status = leetCodeManager.getStatus();
            if (status === UserStatus.SignedIn && intervals.length === 0) {
                startRecurringTasks();
            } else if (status === UserStatus.SignedOut) {
                intervals = clearIntervals(intervals);
            }
        });

        leetCodeTreeDataProvider.initialize(context);
        globalState.initialize(context);
        leetcodeClient.initialize();
        leetnotionClient.initialize();

        const status = leetCodeManager.getStatus();
        if (status === UserStatus.SignedIn) {
            startRecurringTasks();
        }

        leetcodeClient.setTitleSlugQuestionNumberMapping();
        if (globalState.getNotionIntegrationStatus() === "pending") {
            leetnotionManager.updateNotionInfo().then(() => globalState.setNotionIntegrationStatus("done"));
        }

        leetcodeTreeView = vscode.window.createTreeView("leetnotionExplorer", { treeDataProvider: leetCodeTreeDataProvider, showCollapseAll: true });

        context.subscriptions.push(
            leetCodeStatusBarController,
            leetCodeChannel,
            leetCodePreviewProvider,
            leetCodeSubmissionProvider,
            leetCodeSolutionProvider,
            leetCodeExecutor,
            markdownEngine,
            codeLensController,
            explorerNodeManager,
            vscode.window.registerFileDecorationProvider(leetCodeTreeItemDecorationProvider),
            leetcodeTreeView,
            vscode.commands.registerCommand("leetnotion.deleteCache", () => cache.deleteCache()),
            vscode.commands.registerCommand("leetnotion.toggleLeetCodeCn", () => plugin.switchEndpoint()),
            vscode.commands.registerCommand("leetnotion.signin", () => leetCodeManager.signIn()),
            vscode.commands.registerCommand("leetnotion.signout", () => leetCodeManager.signOut()),
            vscode.commands.registerCommand("leetnotion.previewProblem", (node: vscode.Uri) => show.previewProblem(node)),
            vscode.commands.registerCommand("leetnotion.showProblem", (node: LeetCodeNode) => show.showProblem(node)),
            vscode.commands.registerCommand("leetnotion.pickOne", () => show.pickOne()),
            vscode.commands.registerCommand("leetnotion.searchProblem", () => show.searchProblem()),
            vscode.commands.registerCommand("leetnotion.searchCompany", () => show.searchCompany()),
            vscode.commands.registerCommand("leetnotion.searchTag", () => show.searchTag()),
            vscode.commands.registerCommand("leetnotion.searchSheets", () => show.searchSheets()),
            vscode.commands.registerCommand("leetnotion.searchContests", () => show.searchContests()),
            vscode.commands.registerCommand("leetnotion.searchList", () => show.searchLists()),
            vscode.commands.registerCommand("leetnotion.showSolution", (input: LeetCodeNode | vscode.Uri) => show.showSolution(input)),
            vscode.commands.registerCommand("leetnotion.refreshExplorer", () => leetCodeTreeDataProvider.refresh()),
            vscode.commands.registerCommand("leetnotion.testSolution", (uri?: vscode.Uri) => {
                TrackData.report({
                    event_key: `vscode_runCode`,
                    type: "click",
                    extra: JSON.stringify({
                        path: uri?.path,
                    }),
                });
                return test.testSolution(uri);
            }),
            vscode.commands.registerCommand("leetnotion.submitSolution", (uri?: vscode.Uri) => {
                TrackData.report({
                    event_key: `vscode_submit`,
                    type: "click",
                    extra: JSON.stringify({
                        path: uri?.path,
                    }),
                });
                return submit.submitSolution(uri);
            }),
            vscode.commands.registerCommand("leetnotion.switchDefaultLanguage", () => switchDefaultLanguage()),
            vscode.commands.registerCommand("leetnotion.addFavorite", (node: LeetCodeNode) => star.addFavorite(node)),
            vscode.commands.registerCommand("leetnotion.removeFavorite", (node: LeetCodeNode) => star.removeFavorite(node)),
            vscode.commands.registerCommand("leetnotion.problems.sort", () => plugin.switchSortingStrategy()),
            vscode.commands.registerCommand("leetnotion.clearAllData", () => leetnotionManager.clearAllData()),
            vscode.commands.registerCommand("leetnotion.updateTemplateInfo", () => leetnotionManager.updateNotionInfo()),
            vscode.commands.registerCommand("leetnotion.integrateNotion", () => leetnotionManager.enableNotionIntegration()),
            vscode.commands.registerCommand("leetnotion.updateTemplate", () => templateUpdater.updateTemplate()),
            vscode.commands.registerCommand("leetnotion.addSubmissions", () => leetnotionManager.uploadSubmissions()),
            {
                dispose: () => {
                    intervals = clearIntervals(intervals)
                }
            }
        );

        await leetCodeExecutor.switchEndpoint(plugin.getLeetCodeEndpoint());
        await leetCodeManager.getLoginStatus();
        vscode.window.registerUriHandler({ handleUri: leetCodeManager.handleUriSignIn });
    } catch (error) {
        leetCodeChannel.appendLine(error.toString());
        promptForOpenOutputChannel("Extension initialization failed. Please open output channel for details.", DialogType.error);
    }
}

export function deactivate(): void {
    intervals = clearIntervals(intervals);
}

function startRecurringTasks() {
    intervals.push(
        repeatAction(async () => {
            try {
                await Promise.all([
                    leetcodeClient.checkIn(),
                    leetcodeClient.collectEasterEgg(),
                    leetcodeClient.setDailyProblem(),
                    leetnotionClient.setUserQuestionTags(),
                ]);
                leetCodeTreeDataProvider.refresh();
            } catch (error) {
                leetCodeChannel.appendLine(`Failed to perform 30-min interval tasks: ${error}`);
            }
        }, 1000 * 60 * 30)
    );

    intervals.push(
        repeatAction(async () => {
            try {
                await Promise.all([
                    setLists(),
                    setQuestionsOfAllLists(),
                    setProblemRatingMap(),
                ]);
            } catch (error) {
                leetCodeChannel.appendLine(`Failed to perform 2-hour interval tasks: ${error}`);
            }
        }, 1000 * 60 * 60 * 2)
    );
}

