// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.
import { ViewColumn } from "vscode";
import { DialogType, openKeybindingsEditor, promptForOpenOutputChannel, promptHintMessage } from "../utils/uiUtils";
import { ILeetCodeWebviewOption, LeetCodeWebview } from "./LeetCodeWebview";
import { markdownEngine } from "./markdownEngine";
import { leetnotionEngine } from "./leetnotionEngine";
import { SetPropertiesMessage } from "../types";
import { leetnotionClient } from "../leetnotionClient";

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
        const styles: string = [markdownEngine.getStyles(), leetnotionEngine.getStyles()].join("\n");
        const scripts: string = leetnotionEngine.getScripts();
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
        const leetnotionBody: string = leetnotionEngine.render();
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https:; script-src vscode-resource:; style-src vscode-resource:;"/>
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
}

interface IResult {
    [key: string]: string[];
    messages: string[];
}

export const leetCodeSubmissionProvider: LeetCodeSubmissionProvider = new LeetCodeSubmissionProvider();
