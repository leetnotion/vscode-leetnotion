// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { commands, ViewColumn } from "vscode";
import { getLeetCodeEndpoint } from "../commands/plugin";
import { Category, Endpoint, IProblem } from "../shared";
import { ILeetCodeWebviewOption, LeetCodeWebview } from "./LeetCodeWebview";
import { markdownEngine } from "./markdownEngine";
import * as _ from "lodash"
import { explorerNodeManager } from "@/explorer/explorerNodeManager";

class LeetCodePreviewProvider extends LeetCodeWebview {
    protected readonly viewType: string = "leetnotion.preview";
    private node: IProblem;
    private description: IDescription;
    private sideMode: boolean = false;

    public isSideMode(): boolean {
        return this.sideMode;
    }

    public show(descString: string, node: IProblem, isSideMode: boolean = false): void {
        this.description = this.parseDescription(descString, node);
        this.node = node;
        this.sideMode = isSideMode;
        this.showWebviewInternal();
    }

    protected getWebviewOption(): ILeetCodeWebviewOption {
        if (!this.sideMode) {
            return {
                title: `${this.node.name}: Preview`,
                viewColumn: ViewColumn.One,
            };
        } else {
            return {
                title: "Description",
                viewColumn: ViewColumn.Two,
                preserveFocus: true,
            };
        }
    }

    protected getWebviewContent(): string {
        const button: { element: string; script: string; style: string } = {
            element: `<button id="solve">Code Now</button>`,
            script: `const button = document.getElementById('solve');
                    button.onclick = () => vscode.postMessage({
                        command: 'ShowProblem',
                    });`,
            style: `<style>
                #solve {
                    position: fixed;
                    bottom: 1rem;
                    right: 1rem;
                    border: 0;
                    margin: 1rem 0;
                    padding: 0.2rem 1rem;
                    color: white;
                    background-color: var(--vscode-button-background);
                }
                #solve:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                #solve:active {
                    border: 0;
                }
                </style>`,
        };
        const { title, url, category, difficulty, likes, dislikes, body } = this.description;
        const head: string = markdownEngine.render(`# [${title}](${url})`);
        let info: string;
        if(!this.node.rating) {
            info = markdownEngine.render(
                [
                    `| Category | Difficulty | Likes | Dislikes |`,
                    `| :------: | :--------: | :---: | :------: |`,
                    `| ${category} | ${difficulty} | ${likes} | ${dislikes} |`,
                ].join("\n")
            );
        } else {
            info = markdownEngine.render(
                [
                    `| Category | Difficulty | Likes | Dislikes | Rating | Index |`,
                    `| :------: | :--------: | :---: | :------: | :----: | :---: |`,
                    `| ${category} | ${difficulty} | ${likes} | ${dislikes} | ${this.node.rating} | ${this.node.problemIndex}`,
                ].join("\n")
            );
        }
        const tags: string = [
            `<details>`,
            `<summary><strong>Tags</strong></summary>`,
            this.description.tags.map((t: string) =>
                `<a href="#" onclick="onTagClick('${t}')"><code>${t}</code></a>`
            ).join(" | "),
            `</details>`,
        ].join("\n");
        const companies: string = [
            `<details>`,
            `<summary><strong>Companies</strong></summary>`,
            this.description.companies.map((c: string) =>
                `<a href="#" onclick="onCompanyClick('${c}')"><code>${c}</code></a>`
            ).join(" | "),
            `</details>`,
        ].join("\n");
        const links: string = markdownEngine.render(`[Submissions](${this.getSubmissionsLink(url)}) | [Solution](${this.getSolutionsLink(url)})`);
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https:; script-src vscode-resource: 'unsafe-inline'; style-src vscode-resource: 'unsafe-inline';"/>
                ${markdownEngine.getStyles(this.getPanel().webview)}
                ${!this.sideMode ? button.style : ""}
                <style>
                    code { white-space: pre-wrap; }
                </style>
            </head>
            <body>
                ${head}
                ${info}
                ${tags}
                ${companies}
                ${body}
                <hr />
                ${links}
                ${!this.sideMode ? button.element : ""}
                <script>
                    const vscode = acquireVsCodeApi();
                    ${!this.sideMode ? button.script : ""}
                    function onTagClick(tag) {
                        vscode.postMessage({ command: 'TagClick', tag });
                    }
                    function onCompanyClick(company) {
                        vscode.postMessage({ command: 'CompanyClick', company });
                    }
                </script>
            </body>
            </html>
        `;
    }

    protected onDidDisposeWebview(): void {
        super.onDidDisposeWebview();
        this.sideMode = false;
    }

    protected async onDidReceiveMessage(message: IWebViewMessage): Promise<void> {
        console.log("Received message:", message);
        switch (message.command) {
            case "ShowProblem": {
                await commands.executeCommand("leetnotion.showProblem", this.node);
                break;
            }
            case "TagClick": {
                explorerNodeManager.revealNode(`${Category.Tag}#${message.tag}`);
                break;
            }
            case "CompanyClick": {
                explorerNodeManager.revealNode(`${Category.Company}#${message.company}`);
                break;
            }
        }
    }

    // private async hideSideBar(): Promise<void> {
    //     await commands.executeCommand("workbench.action.focusSideBar");
    //     await commands.executeCommand("workbench.action.toggleSidebarVisibility");
    // }

    private parseDescription(descString: string, problem: IProblem): IDescription {
        const [
            ,
            ,
            /* title */ url,
            ,
            ,
            ,
            ,
            ,
            /* tags */ /* langs */ category,
            difficulty,
            likes,
            dislikes,
            ,
            ,
            ,
            ,
            /* accepted */ /* submissions */ /* testcase */ ...body
        ] = descString.split("\n");
        return {
            title: problem.name,
            url,
            tags: problem.tags,
            companies: problem.companies,
            category: category.slice(2),
            difficulty: difficulty.slice(2),
            likes: likes.split(": ")[1].trim(),
            dislikes: dislikes.split(": ")[1].trim(),
            body: body.join("\n").replace(/<pre>[\r\n]*([^]+?)[\r\n]*<\/pre>/g, "<pre><code>$1</code></pre>"),
        };
    }

    private getTagLink(tag: string): string {
        const endPoint: string = getLeetCodeEndpoint();
        if (endPoint === Endpoint.LeetCodeCN) {
            return `https://leetcode.cn/tag/${tag}?source=vscode`;
        } else if (endPoint === Endpoint.LeetCode) {
            return `https://leetcode.com/tag/${tag}?source=vscode`;
        }

        return "https://leetcode.com?source=vscode";
    }

    private getSolutionsLink(url: string): string {
        return url.replace("/description/", "/solutions/") + "?source=vscode";
    }
    private getSubmissionsLink(url: string): string {
        return url.replace("/description/", "/submissions/") + "?source=vscode";
    }
}

interface IDescription {
    title: string;
    url: string;
    tags: string[];
    companies: string[];
    category: string;
    difficulty: string;
    likes: string;
    dislikes: string;
    body: string;
}

interface IWebViewMessage {
    command: string;
    tag?: string;
    company?: string;
}

export const leetCodePreviewProvider: LeetCodePreviewProvider = new LeetCodePreviewProvider();
