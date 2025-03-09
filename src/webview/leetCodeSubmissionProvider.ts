// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.
import { ViewColumn } from "vscode";
import { DialogType, openKeybindingsEditor, promptForOpenOutputChannel, promptHintMessage } from "../utils/uiUtils";
import { ILeetCodeWebviewOption, LeetCodeWebview } from "./LeetCodeWebview";
import { markdownEngine } from "./markdownEngine";
import { leetnotionEngine } from "./leetnotionEngine";
import { SetPropertiesMessage } from "../types";
import { leetnotionClient } from "../leetnotionClient";
import { leetCodeChannel } from "@/leetCodeChannel";
import * as vscode from 'vscode';
import { globalState } from "@/globalState";
import * as path from "path";
import * as os from 'os';

class LeetCodeSubmissionProvider extends LeetCodeWebview {

    protected readonly viewType: string = "leetnotion.submission";
    private result: IResult;

    public show(resultString: string): void {
        this.result = this.parseResult(resultString);
        this.showWebviewInternal();
        this.showKeybindingsHint();
    }

    protected getWebviewOption(): ILeetCodeWebviewOption {
        return {
            title: "Submission",
            viewColumn: ViewColumn.Two,
        };
    }

    protected getWebviewContent(): string {
        const webview = this.panel.webview;
        const styles: string = [markdownEngine.getStyles(webview), this.getStyles()].join("\n");
        const scripts: string = this.getScripts();
        const title: string = `## ${this.result.messages[0]}`;
        const messages: string[] = this.result.messages.slice(1).map((m: string) => `* ${m}`);
        const sections: string[] = Object.keys(this.result)
            .filter((key: string) => key !== "messages")
            .map((key: string) => [
                `### ${key}`,
                "```",
                this.result[key].join("\n"),
                "```",
            ].join("\n"));
        const body: string = markdownEngine.render([
            title,
            ...messages,
            ...sections,
        ].join("\n"));
        const leetnotionBody: string = leetnotionEngine.render(webview);
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv="Content-Security-Policy" content="
                    default-src 'none';
                    img-src ${webview.cspSource} https: data:;
                    script-src ${webview.cspSource} 'unsafe-inline' 'unsafe-eval';
                    style-src ${webview.cspSource} 'unsafe-inline' https://*.vscode-cdn.net https://cdnjs.cloudflare.com;
                    font-src ${webview.cspSource} https://*.vscode-cdn.net https://cdnjs.cloudflare.com data:;
                ">
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                ${styles}
                ${scripts}
            </head>
            <body class="vscode-body 'scrollBeyondLastLine' 'wordWrap' 'showEditorSelection'" style="tab-size:4">
                ${body}
                <hr />
                ${leetnotionBody}
            </body>
            </html>
        `;
    }

    protected onDidDisposeWebview(): void {
        super.onDidDisposeWebview();
    }

    protected async onDidReceiveMessage(message: SetPropertiesMessage): Promise<void> {
        switch (message.command) {
            case 'set-properties': {
                await leetnotionClient.setProperties(message);
                promptForOpenOutputChannel(`Properties Updated in Notion`, DialogType.completed);
                break;
            }
            default: {
                break;
            }
        }
    }

    private async showKeybindingsHint(): Promise<void> {
        await promptHintMessage(
            "hint.commandShortcut",
            'You can customize shortcut key bindings in File > Preferences > Keyboard Shortcuts with query "leetcode".',
            "Open Keybindings",
            (): Promise<any> => openKeybindingsEditor("leetcode solution"),
        );
    }

    private parseResult(raw: string): IResult {
        raw = raw.concat("  √ "); // Append a dummy sentinel to the end of raw string
        const regSplit: RegExp = /  [√×✔✘vx] ([^]+?)\n(?=  [√×✔✘vx] )/g;
        const regKeyVal: RegExp = /(.+?): ([^]*)/;
        const result: IResult = { messages: [] };
        let entry: RegExpExecArray | null;
        do {
            entry = regSplit.exec(raw);
            if (!entry) {
                continue;
            }
            const kvMatch: RegExpExecArray | null = regKeyVal.exec(entry[1]);
            if (kvMatch) {
                const [key, value] = kvMatch.slice(1);
                if (value) { // Do not show empty string
                    if (!result[key]) {
                        result[key] = [];
                    }
                    result[key].push(value);
                }
            } else {
                result.messages.push(entry[1]);
            }
        } while (entry);
        return result;
    }

    private getScripts() {
        let scripts: vscode.Uri[] = [];
        try {
            const scriptPaths = ["jquery.min.js", "select2.min.js"];
            scripts = scriptPaths.map((p: string) => {
                const onDiskPath = vscode.Uri.joinPath(
                    globalState.getExtensionUri(),
                    "public",
                    "scripts",
                    p,
                );
                return this.panel
                    ? this.panel.webview.asWebviewUri(onDiskPath)
                    : onDiskPath;
            });
        } catch (error) {
            leetCodeChannel.appendLine("[Error] Fail to load built-in markdown style file.");
        }
        return scripts.map((script: vscode.Uri) => `<script src="${script.toString()}"></script>`).join(os.EOL);
    }

    public getStyles(): string {
        let styles: vscode.Uri[] = [];
        try {
            const stylePaths: string[] = ['select2.min.css', 'style.css'];
            styles = stylePaths.map((p: string) => {
                const onDiskPath = vscode.Uri.joinPath(
                    globalState.getExtensionUri(),
                    "public",
                    "styles",
                    p,
                );
                return this.panel
                    ? this.panel.webview.asWebviewUri(onDiskPath)
                    : onDiskPath;
            });
        } catch (error) {
            leetCodeChannel.appendLine("[Error] Fail to load built-in markdown style file.");
        }
        return styles.map((style: vscode.Uri) => `<link rel="stylesheet" type="text/css" href="${style.toString()}">`).join(os.EOL);
    }
}

interface IResult {
    [key: string]: string[];
    messages: string[];
}

export const leetCodeSubmissionProvider: LeetCodeSubmissionProvider = new LeetCodeSubmissionProvider();
