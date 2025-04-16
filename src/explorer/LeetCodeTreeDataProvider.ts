// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { leetCodeManager } from "../leetCodeManager";
import { Category, defaultProblem, ProblemState } from "../shared";
import { explorerNodeManager } from "./explorerNodeManager";
import { LeetCodeNode } from "./LeetCodeNode";
import { globalState } from "../globalState";
import { extractArrayElements } from "@/utils/dataUtils";

export class LeetCodeTreeDataProvider implements vscode.TreeDataProvider<LeetCodeNode> {
    private context: vscode.ExtensionContext;

    private onDidChangeTreeDataEvent: vscode.EventEmitter<LeetCodeNode | undefined | null> = new vscode.EventEmitter<
        LeetCodeNode | undefined | null
    >();
    // tslint:disable-next-line:member-ordering
    public readonly onDidChangeTreeData: vscode.Event<any> = this.onDidChangeTreeDataEvent.event;

    public initialize(context: vscode.ExtensionContext): void {
        this.context = context;
    }

    public async refresh(): Promise<void> {
        await explorerNodeManager.refreshCache();
        this.onDidChangeTreeDataEvent.fire(null);
    }

    public getTreeItem(element: LeetCodeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (element.id === "notSignIn") {
            return {
                label: element.name,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: "leetnotion.signin",
                    title: "Sign in to LeetCode",
                },
            };
        }

        let contextValue: string;
        if (element.isProblem) {
            contextValue = element.isFavorite ? "problem-favorite" : "problem";
        } else {
            contextValue = element.id.toLowerCase();
        }

        return {
            label: element.isProblem ? `[${element.id}] ${element.name}` + this.parsePremiumUnLockIconPath(element) : element.name,
            tooltip: this.getSubCategoryTooltip(element),
            collapsibleState: element.isProblem ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
            iconPath: this.parseIconPathFromProblemState(element),
            command: element.isProblem ? element.previewCommand : undefined,
            resourceUri: element.uri,
            contextValue,
        };
    }

    public getChildren(element?: LeetCodeNode | undefined): vscode.ProviderResult<LeetCodeNode[]> {
        if (!leetCodeManager.getUser()) {
            return [
                new LeetCodeNode(
                    Object.assign({}, defaultProblem, {
                        id: "notSignIn",
                        name: "Sign in to LeetCode",
                    }),
                    false
                ),
            ];
        }
        if (!element) {
            // Root view
            return explorerNodeManager.getRootNodes();
        } else {
            return this.getChildrenByElementId(element.id, element.isProblem);
        }
    }

    public getParent(element: LeetCodeNode): vscode.ProviderResult<LeetCodeNode> {
        return explorerNodeManager.getParentNode(element.id);
    }

    private getChildrenByElementId(id: string, isProblem = false) {
        if(isProblem) {
            return [];
        }
        return explorerNodeManager.getChildrenNodesById(id);
    }

    private parseIconPathFromProblemState(element: LeetCodeNode): string {
        if (!element.isProblem) {
            return "";
        }
        const { isPremium } = globalState.getUserStatus() ?? {};
        switch (element.state) {
            case ProblemState.AC:
                return this.context.asAbsolutePath(path.join("resources", "check.png"));
            case ProblemState.NotAC:
                return this.context.asAbsolutePath(path.join("resources", "x.png"));
            case ProblemState.Unknown:
                if (element.locked && !isPremium) {
                    return this.context.asAbsolutePath(path.join("resources", "lock.png"));
                }
                return this.context.asAbsolutePath(path.join("resources", "blank.png"));
            default:
                return "";
        }
    }

    private parsePremiumUnLockIconPath(element: LeetCodeNode): string {
        const { isPremium } = globalState.getUserStatus() ?? {};
        if (isPremium && element.locked) {
            return "  🔓";
        }
        return "";
    }

    private getSubCategoryTooltip(element: LeetCodeNode): string {
        if (element.isProblem) {
            const base = `Acceptance: ${element.acceptanceRate}%`;
            return element.rating
                ? `${base}\nRating: ${element.rating}\nIndex: ${element.problemIndex}`
                : base;
        }

        const skipIds = [ "ROOT", Category.Difficulty, Category.Daily ];
        if (skipIds.includes(element.id)) {
            return "";
        }

        const childrenNodes: LeetCodeNode[] = this.getChildrenByElementId(element.id);

        const categoryTooltips: Record<string, string> = {
            [Category.Tag]: `No of tags: ${childrenNodes.length}`,
            [Category.Company]: `No of companies: ${childrenNodes.length}`,
            [Category.Sheets]: `No of sheets: ${childrenNodes.length}`,
            [Category.Lists]: `No of lists: ${childrenNodes.length}`
        };

        if (element.id in categoryTooltips) {
            return categoryTooltips[element.id];
        }

        const { acceptedNum, failedNum, totalNum } = this.getSolvedDetailsOfList(element.id);
        return [`AC: ${acceptedNum}`, `Failed: ${failedNum}`, `Total: ${totalNum}`].join(os.EOL);
    }

    private getSolvedDetailsOfList(id: string) {
        const data = explorerNodeManager.getExplorerDataById(id);
        if(!data) {
            return { acceptedNum: 0, failedNum: 0, totalNum: 0 };
        }
        const problemIds = Array.from(new Set(extractArrayElements(data)));
        const problems = explorerNodeManager.getProblemNodesByIds(problemIds);
        const acceptedNum = problems.filter(problem => problem.state === ProblemState.AC).length;
        const failedNum = problems.filter(problem => problem.state === ProblemState.NotAC).length;
        const totalNum = problems.length;
        return {
            acceptedNum,
            failedNum,
            totalNum,
        }
    }
}

export const leetCodeTreeDataProvider: LeetCodeTreeDataProvider = new LeetCodeTreeDataProvider();
