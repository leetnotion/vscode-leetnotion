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
        // return '' unless it is a sub-category node
        if(element.isProblem) {
            if(element.rating) {
                return `Acceptance: ${element.acceptanceRate}%\nRating: ${element.rating}\nIndex: ${element.problemIndex}`
            } else {
                return `Acceptance: ${element.acceptanceRate}%`
            }
        }
        if (element.id === "ROOT") {
            return "";
        }

        let childrenNodes: LeetCodeNode[] = this.getChildrenByElementId(element.id);

        if(element.id in Category) {
            return `Count: ${childrenNodes.length}`
        }

        if(element.id.startsWith(Category.Sheets) && element.id.split(".").length === 2) {
            let problemNodes: LeetCodeNode[] = [];
            for(const childNode of childrenNodes) {
                const problems = this.getChildrenByElementId(childNode.id);
                problemNodes = [...problemNodes, ...problems];
            }
            childrenNodes = problemNodes;
        }

        let acceptedNum: number = 0;
        let failedNum: number = 0;
        for (const node of childrenNodes) {
            switch (node.state) {
                case ProblemState.AC:
                    acceptedNum++;
                    break;
                case ProblemState.NotAC:
                    failedNum++;
                    break;
                default:
                    break;
            }
        }

        return [`AC: ${acceptedNum}`, `Failed: ${failedNum}`, `Total: ${childrenNodes.length}`].join(os.EOL);
    }
}

export const leetCodeTreeDataProvider: LeetCodeTreeDataProvider = new LeetCodeTreeDataProvider();
