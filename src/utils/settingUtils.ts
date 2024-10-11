// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { workspace, WorkspaceConfiguration } from "vscode";
import { defaultFooters, defaultHeaders, DescriptionConfiguration } from "../shared";

export function getWorkspaceConfiguration(): WorkspaceConfiguration {
    return workspace.getConfiguration("leetnotion");
}

export function shouldHideSolvedProblem(): boolean {
    return getWorkspaceConfiguration().get<boolean>("hideSolved", false);
}

export function getWorkspaceFolder(): string {
    return getWorkspaceConfiguration().get<string>("workspaceFolder", "");
}

export function getEditorShortcuts(): string[] {
    return getWorkspaceConfiguration().get<string[]>("editor.shortcuts", ["submit", "test"]);
}

export function hasStarShortcut(): boolean {
    const shortcuts: string[] = getWorkspaceConfiguration().get<string[]>("editor.shortcuts", ["submit", "test"]);
    return shortcuts.indexOf("star") >= 0;
}

export function shouldUseEndpointTranslation(): boolean {
    return getWorkspaceConfiguration().get<boolean>("useEndpointTranslation", true);
}

export function getDescriptionConfiguration(): IDescriptionConfiguration {
    const setting: string = getWorkspaceConfiguration().get<string>("showDescription", DescriptionConfiguration.InWebView);
    const config: IDescriptionConfiguration = {
        showInComment: false,
        showInWebview: true,
    };
    switch (setting) {
        case DescriptionConfiguration.Both:
            config.showInComment = true;
            config.showInWebview = true;
            break;
        case DescriptionConfiguration.None:
            config.showInComment = false;
            config.showInWebview = false;
            break;
        case DescriptionConfiguration.InFileComment:
            config.showInComment = true;
            config.showInWebview = false;
            break;
        case DescriptionConfiguration.InWebView:
            config.showInComment = false;
            config.showInWebview = true;
            break;
    }

    // To be compatible with the deprecated setting:
    if (getWorkspaceConfiguration().get<boolean>("showCommentDescription")) {
        config.showInComment = true;
    }

    return config;
}

export function hasNotionIntegrationEnabled(): boolean {
    return getWorkspaceConfiguration().get<boolean>("enableNotionIntegration", true);
}

export function shouldAddCodeToSubmissionPage(): boolean {
    return getWorkspaceConfiguration().get<boolean>("addCodeToSubmissionPage", true);
}

export function getCompaniesSortingStrategy(): string {
    return getWorkspaceConfiguration().get<string>("companies.sortStrategy", "Popularity");
}

export function getQuestionTagsSortingStrategy(): string {
    return getWorkspaceConfiguration().get<string>("questionTags.sortingStrategy", "Popularity");
}

export function getCodeHeader(language: string): string {
    const headers = getWorkspaceConfiguration().get<Record<string, string>>("language.header");
    return headers?.[language] ?? defaultHeaders?.[language] ?? "";
}

export function getCodeFooter(language: string): string {
    const footers = getWorkspaceConfiguration().get<Record<string, string>>("language.footer");
    return footers?.[language] ?? defaultFooters?.[language] ?? "";
}

export interface IDescriptionConfiguration {
    showInComment: boolean;
    showInWebview: boolean;
}
