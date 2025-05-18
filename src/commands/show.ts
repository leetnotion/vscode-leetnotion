// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as _ from "lodash";
import * as path from "path";
import unescapeJS from "unescape-js";
import * as vscode from "vscode";
import { explorerNodeManager } from "../explorer/explorerNodeManager";
import { LeetCodeNode } from "../explorer/LeetCodeNode";
import { leetCodeChannel } from "../leetCodeChannel";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { leetCodeManager } from "../leetCodeManager";
import { ALL_TIME, Category, Endpoint, IProblem, IQuickItemEx, languages, PREMIUM_URL_CN, PREMIUM_URL_GLOBAL, ProblemState } from "../shared";
import { genFileExt, genFileName, getNodeIdFromFile } from "../utils/problemUtils";
import * as settingUtils from "../utils/settingUtils";
import { IDescriptionConfiguration } from "../utils/settingUtils";
import {
    DialogOptions,
    DialogType,
    openSettingsEditor,
    openUrl,
    promptForOpenOutputChannel,
    promptForSignIn,
    promptHintMessage,
} from "../utils/uiUtils";
import { getActiveFilePath, selectWorkspaceFolder } from "../utils/workspaceUtils";
import * as wsl from "../utils/wslUtils";
import { leetCodePreviewProvider } from "../webview/leetCodePreviewProvider";
import { leetCodeSolutionProvider } from "../webview/leetCodeSolutionProvider";
import * as list from "./list";
import { getLeetCodeEndpoint } from "./plugin";
import { globalState } from "../globalState";
import { extractArrayElements, getCompanyTags, getLists, getSheets, getTopicTags } from "@/utils/dataUtils";
import { CompanyTags, Lists, Sheets, TopicTags } from "@/types";
import TrackData from "../utils/trackingUtils";

export async function previewProblem(input: IProblem | vscode.Uri, isSideMode: boolean = false): Promise<void> {
    let node: IProblem;

    if (input instanceof vscode.Uri) {
        const activeFilePath: string = input.fsPath;
        const id: string = await getNodeIdFromFile(activeFilePath);
        if (!id) {
            vscode.window.showErrorMessage(`Failed to resolve the problem id from file: ${activeFilePath}.`);
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
        type: "click",
        extra: JSON.stringify({
            problem_id: node.id,
            problem_name: node.name,
        }),
    });

    const needTranslation: boolean = settingUtils.shouldUseEndpointTranslation();
    const descString: string = await leetCodeExecutor.getDescription(node.id, needTranslation);
    leetCodePreviewProvider.show(descString, node, isSideMode);
}

export async function pickOne(): Promise<void> {
    const problems: IProblem[] = await list.listProblems();
    const randomProblem: IProblem = problems[Math.floor(Math.random() * problems.length)];
    await showProblemInternal(randomProblem);
}

export async function showProblem(node?: LeetCodeNode): Promise<void> {
    if (!node) {
        return;
    }
    await showProblemInternal(node);
}

export async function searchProblem(): Promise<void> {
    if (!leetCodeManager.getUser()) {
        promptForSignIn();
        return;
    }
    const choice: IQuickItemEx<IProblem> | undefined = await vscode.window.showQuickPick(parseProblemsToPicks(list.listProblems()), {
        matchOnDetail: true,
        placeHolder: "Select one problem",
    });
    if (!choice) {
        return;
    }
    await showProblemInternal(choice.value);
}

export async function searchCompany(): Promise<void> {
    if (!leetCodeManager.getUser()) {
        promptForSignIn();
        return;
    }
    const companyTags = getCompanyTags();
    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(parseCompaniesToPicks(companyTags), {
        matchOnDetail: true,
        placeHolder: "Select one company",
    });
    if (!choice) {
        return;
    }
    explorerNodeManager.revealNode(`${Category.Company}#${choice.value}`);
}

export async function searchTag(): Promise<void> {
    if (!leetCodeManager.getUser()) {
        promptForSignIn();
        return;
    }
    const topicTags = await getTopicTags();
    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(parseTagsToPicks(topicTags), {
        matchOnDetail: true,
        placeHolder: "Search for a tag",
    });
    if (!choice) {
        return;
    }
    explorerNodeManager.revealNode(`${Category.Tag}#${choice.value}`);
}

export async function searchContests(): Promise<void> {
    if (!leetCodeManager.getUser()) {
        promptForSignIn();
        return;
    }
    const sheets = globalState.get("leetcodeContests") as Record<string, string[]>;
    if(!sheets) {
        leetCodeChannel.appendLine("Failed to get leetcode contests");
        return;
    }
    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(parseContestsToPicks(sheets), {
        matchOnDetail: true,
        placeHolder: "Search for a contest",
    });
    if (!choice) {
        return;
    }
    explorerNodeManager.revealNode(`${Category.Contests}#${choice.value}`);
}

export async function searchSheets(): Promise<void> {
    if (!leetCodeManager.getUser()) {
        promptForSignIn();
        return;
    }
    const sheets = getSheets();
    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(parseSheetsToPicks(sheets), {
        matchOnDetail: true,
        placeHolder: "Search for a sheet",
    });
    if (!choice) {
        return;
    }
    explorerNodeManager.revealNode(`${Category.Sheets}#${choice.value}`);
}

export async function searchLists(): Promise<void> {
    if (!leetCodeManager.getUser()) {
        promptForSignIn();
        return;
    }
    const lists = await getLists();
    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(parseListsToPicks(lists), {
        matchOnDetail: true,
        placeHolder: "Search for a list",
    });
    if (!choice) {
        return;
    }
    explorerNodeManager.revealNode(`${Category.Lists}#${choice.value}`);
}

export async function showSolution(input: LeetCodeNode | vscode.Uri): Promise<void> {
    let problemInput: string | undefined;
    if (input instanceof LeetCodeNode) {
        // Triggerred from explorer
        problemInput = input.id;
    } else if (input instanceof vscode.Uri) {
        // Triggerred from Code Lens/context menu
        problemInput = `"${input.fsPath}"`;
    } else if (!input) {
        // Triggerred from command
        problemInput = await getActiveFilePath();
    }

    if (!problemInput) {
        vscode.window.showErrorMessage("Invalid input to fetch the solution data.");
        return;
    }

    const language: string | undefined = await fetchProblemLanguage();
    if (!language) {
        return;
    }
    try {
        const needTranslation: boolean = settingUtils.shouldUseEndpointTranslation();
        const solution: string = await leetCodeExecutor.showSolution(problemInput, language, needTranslation);
        leetCodeSolutionProvider.show(unescapeJS(solution));
    } catch (error) {
        leetCodeChannel.appendLine(error.toString());
        await promptForOpenOutputChannel("Failed to fetch the top voted solution. Please open the output channel for details.", DialogType.error);
    }
}

async function fetchProblemLanguage(): Promise<string | undefined> {
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetnotion");
    let defaultLanguage: string | undefined = leetCodeConfig.get<string>("defaultLanguage");
    if (defaultLanguage && languages.indexOf(defaultLanguage) < 0) {
        defaultLanguage = undefined;
    }
    const language: string | undefined =
        defaultLanguage ||
        (await vscode.window.showQuickPick(languages, {
            placeHolder: "Select the language you want to use",
            ignoreFocusOut: true,
        }));
    // fire-and-forget default language query
    (async (): Promise<void> => {
        if (language && !defaultLanguage && leetCodeConfig.get<boolean>("hint.setDefaultLanguage")) {
            const choice: vscode.MessageItem | undefined = await vscode.window.showInformationMessage(
                `Would you like to set '${language}' as your default language?`,
                DialogOptions.yes,
                DialogOptions.no,
                DialogOptions.never
            );
            if (choice === DialogOptions.yes) {
                leetCodeConfig.update("defaultLanguage", language, true /* UserSetting */);
            } else if (choice === DialogOptions.never) {
                leetCodeConfig.update("hint.setDefaultLanguage", false, true /* UserSetting */);
            }
        }
    })();
    return language;
}

async function showProblemInternal(node: IProblem): Promise<void> {
    try {
        const isDatabaseLanguage = node.tags.indexOf("Database") >= 0;
        let language: string | undefined;
        if(isDatabaseLanguage) {
            language = "mysql"
        } else {
            language = await fetchProblemLanguage();
        }
        if (!language) {
            return;
        }

        const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetnotion");
        const workspaceFolder: string = await selectWorkspaceFolder();
        if (!workspaceFolder) {
            return;
        }

        const fileFolder: string = leetCodeConfig
            .get<string>(`filePath.${language}.folder`, leetCodeConfig.get<string>(`filePath.default.folder`, ""))
            .trim();
        const fileName: string = leetCodeConfig
            .get<string>(`filePath.${language}.filename`, leetCodeConfig.get<string>(`filePath.default.filename`) || genFileName(node, language))
            .trim();

        let finalPath: string = path.join(workspaceFolder, fileFolder, fileName);

        if (finalPath) {
            finalPath = await resolveRelativePath(finalPath, node, language);
            if (!finalPath) {
                leetCodeChannel.appendLine("Showing problem canceled by user.");
                return;
            }
        }

        finalPath = wsl.useWsl() ? await wsl.toWinPath(finalPath) : finalPath;

        const descriptionConfig: IDescriptionConfiguration = settingUtils.getDescriptionConfiguration();
        const needTranslation: boolean = settingUtils.shouldUseEndpointTranslation();

        await leetCodeExecutor.showProblem(node, language, finalPath, descriptionConfig.showInComment, needTranslation);
        const promises: any[] = [
            vscode.window.showTextDocument(vscode.Uri.file(finalPath), {
                preview: false,
                viewColumn: vscode.ViewColumn.One,
            }),
            promptHintMessage(
                "hint.commentDescription",
                'You can config how to show the problem description through "leetnotion.showDescription".',
                "Open settings",
                (): Promise<any> => openSettingsEditor("leetnotion.showDescription")
            ),
        ];
        if (descriptionConfig.showInWebview) {
            promises.push(showDescriptionView(node));
        }

        await Promise.all(promises);
    } catch (error) {
        await promptForOpenOutputChannel(`${error} Please open the output channel for details.`, DialogType.error);
    }
}

async function showDescriptionView(node: IProblem): Promise<void> {
    return previewProblem(node, vscode.workspace.getConfiguration("leetnotion").get<boolean>("enableSideMode", true));
}
async function parseProblemsToPicks(p: Promise<IProblem[]>): Promise<Array<IQuickItemEx<IProblem>>> {
    return new Promise(async (resolve: (res: Array<IQuickItemEx<IProblem>>) => void): Promise<void> => {
        const picks: Array<IQuickItemEx<IProblem>> = (await p).map((problem: IProblem) =>
            Object.assign(
                {},
                {
                    label: `${parseProblemDecorator(problem.state, problem.locked)}${problem.id}.${problem.name}`,
                    description: "",
                    detail: `AC rate: ${problem.passRate}, Difficulty: ${problem.difficulty}`,
                    value: problem,
                }
            )
        );
        resolve(picks);
    });
}

async function parseCompaniesToPicks(companyTags: CompanyTags) {
    const lenMap = {};
    Object.keys(companyTags).forEach((key) => {
        lenMap[key] = companyTags[key][ALL_TIME] ? companyTags[key][ALL_TIME].length : (companyTags[key] as string[]).length;
    });
    const picks: Array<IQuickItemEx<string>> = Object.keys(companyTags).sort((a, b) => lenMap[b] - lenMap[a]).map((company: string) =>
        Object.assign(
            {},
            {
                label: company,
                description: "",
                detail: `No of Problems: ${companyTags[company][ALL_TIME] ? companyTags[company][ALL_TIME].length : (companyTags[company] as string[]).length}`,
                value: company,
            }
        )
    );
    return picks;
}

async function parseSheetsToPicks(sheets: Sheets) {
    const picks: Array<IQuickItemEx<string>> = Object.keys(sheets).map((sheet: string) =>
        Object.assign(
            {},
            {
                label: sheet,
                description: "",
                detail: `No of Problems: ${extractArrayElements(sheets[sheet]).length}`,
                value: sheet,
            }
        )
    );
    return picks;
}

async function parseContestsToPicks(contests: Record<string, string[]>) {
    const picks: Array<IQuickItemEx<string>> = Object.keys(contests).map((sheet: string) =>
        Object.assign(
            {},
            {
                label: sheet,
                description: "",
                detail: `No of Problems: ${extractArrayElements(contests[sheet]).length}`,
                value: sheet,
            }
        )
    );
    return picks;
}

async function parseTagsToPicks(tags: TopicTags) {
    const picks: Array<IQuickItemEx<string>> = Object.keys(tags).map((tag: string) =>
        Object.assign(
            {},
            {
                label: tag,
                description: "",
                detail: `No of Problems: ${tags[tag].length}`,
                value: tag,
            }
        )
    );
    return picks;
}

async function parseListsToPicks(lists: Lists) {
    const picks: Array<IQuickItemEx<string>> = lists.map((list) =>
        Object.assign(
            {},
            {
                label: list.name,
                description: "",
                value: list.name,
            }
        )
    );
    return picks;
}

function parseProblemDecorator(state: ProblemState, locked: boolean): string {
    switch (state) {
        case ProblemState.AC:
            return "$(check) ";
        case ProblemState.NotAC:
            return "$(x) ";
        default:
            return locked ? "$(lock) " : "";
    }
}

async function resolveRelativePath(relativePath: string, node: IProblem, selectedLanguage: string): Promise<string> {
    let tag: string = "";
    if (/\$\{tag\}/i.test(relativePath)) {
        tag = (await resolveTagForProblem(node)) || "";
    }

    let company: string = "";
    if (/\$\{company\}/i.test(relativePath)) {
        company = (await resolveCompanyForProblem(node)) || "";
    }

    return relativePath.replace(/\$\{(.*?)\}/g, (_substring: string, ...args: string[]) => {
        const placeholder: string = args[0].toLowerCase().trim();
        switch (placeholder) {
            case "id":
                return node.id;
            case "name":
                return node.name;
            case "camelcasename":
                return _.camelCase(node.name);
            case "pascalcasename":
                return _.upperFirst(_.camelCase(node.name));
            case "kebabcasename":
            case "kebab-case-name":
                return _.kebabCase(node.name);
            case "snakecasename":
            case "snake_case_name":
                return _.snakeCase(node.name);
            case "ext":
                return genFileExt(selectedLanguage);
            case "language":
                return selectedLanguage;
            case "difficulty":
                return node.difficulty.toLocaleLowerCase();
            case "tag":
                return tag;
            case "company":
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
        placeHolder: "Multiple tags available, please select one",
        ignoreFocusOut: true,
    });
}

async function resolveCompanyForProblem(problem: IProblem): Promise<string | undefined> {
    if (problem.companies.length === 1) {
        return problem.companies[0];
    }
    return await vscode.window.showQuickPick(problem.companies, {
        matchOnDetail: true,
        placeHolder: "Multiple tags available, please select one",
        ignoreFocusOut: true,
    });
}
