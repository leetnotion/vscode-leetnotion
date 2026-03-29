// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as fse from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { ViewColumn } from 'vscode';
import { leetCodeChannel } from '@/leetCodeChannel';
import { leetcodeClient } from '@/leetCodeClient';
import { IProblem, langExt } from '../shared';
import { extractCode, getLangFromFile } from '../utils/problemUtils';
import { DialogType, promptForOpenOutputChannel } from '../utils/uiUtils';
import { ILeetCodeWebviewOption, LeetCodeWebview } from './LeetCodeWebview';
import { leetCodeSubmissionProvider } from './leetCodeSubmissionProvider';
import { markdownEngine } from './markdownEngine';

class LeetCodeTestCaseProvider extends LeetCodeWebview {
    protected readonly viewType: string = 'leetnotion.testcase';
    private node: IProblem;
    private sampleTestCase: string = '';
    private filePath: string = '';

    public show(node: IProblem, sampleTestCase: string, filePath: string): void {
        this.node = node;
        this.sampleTestCase = sampleTestCase;
        this.filePath = filePath;
        this.showWebviewInternal();
    }

    protected getWebviewOption(): ILeetCodeWebviewOption {
        return {
            title: 'Test Cases',
            viewColumn: ViewColumn.Two,
            preserveFocus: true,
        };
    }

    protected getWebviewContent(): string {
        const webview = this.panel!.webview;
        const styles = markdownEngine.getStyles(webview);
        const escapeHtml = (s: string) =>
            s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        const escapedTitle = escapeHtml(this.node.name);
        const escapedTestCase = this.sampleTestCase
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv="Content-Security-Policy" content="
                    default-src 'none';
                    img-src ${webview.cspSource} https: data:;
                    script-src 'unsafe-inline';
                    style-src ${webview.cspSource} 'unsafe-inline';
                ">
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                ${styles}
                <style>
                    body {
                        padding: 0;
                        margin: 0;
                    }
                    .container {
                        padding: 12px 16px;
                    }
                    .title {
                        font-size: 16px;
                        font-weight: 600;
                        padding-bottom: 12px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        margin-bottom: 12px;
                    }
                    .label {
                        font-size: 12px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 6px;
                    }
                    textarea {
                        width: 100%;
                        min-height: 200px;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 4px;
                        padding: 8px;
                        font-family: var(--vscode-editor-font-family), monospace;
                        font-size: var(--vscode-editor-font-size, 13px);
                        resize: vertical;
                        box-sizing: border-box;
                    }
                    textarea:focus {
                        outline: 1px solid var(--vscode-focusBorder);
                        border-color: var(--vscode-focusBorder);
                    }
                    .actions {
                        margin-top: 12px;
                        display: flex;
                        justify-content: flex-end;
                    }
                    .test-btn {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 28px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 13px;
                    }
                    .test-btn:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="title">${escapedTitle}</div>
                    <div class="label">Test Cases</div>
                    <textarea id="testcases" spellcheck="false">${escapedTestCase}</textarea>
                    <div class="actions">
                        <button class="test-btn" id="testBtn">Test</button>
                    </div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    const textarea = document.getElementById('testcases');
                    const testBtn = document.getElementById('testBtn');
                    testBtn.onclick = () => {
                        const testCases = textarea.value.trim();
                        if (!testCases) return;
                        vscode.postMessage({ command: 'test', testCases });
                    };
                </script>
            </body>
            </html>
        `;
    }

    protected async onDidReceiveMessage(message: { command: string; testCases: string }): Promise<void> {
        switch (message.command) {
            case 'test': {
                try {
                    const rawCode = await fse.readFile(this.filePath, 'utf-8');
                    const code = extractCode(rawCode);
                    let lang: string | null = getLangFromFile(rawCode);
                    if (!lang) {
                        const ext = path.extname(this.filePath).slice(1);
                        for (const [langName, langExtVal] of langExt.entries()) {
                            if (langExtVal === ext) {
                                lang = langName;
                                break;
                            }
                        }
                    }
                    const slug = this.node.slug;
                    const questionId = Number(this.node.id);

                    if (!slug || !lang || isNaN(questionId)) {
                        vscode.window.showErrorMessage('Could not determine problem metadata.');
                        return;
                    }

                    leetCodeChannel.appendLine(`[Test] file: ${this.filePath}`);
                    leetCodeChannel.appendLine(`[Test] slug: ${slug}, lang: ${lang}, questionId: ${questionId}`);

                    const results = await vscode.window.withProgress(
                        { location: vscode.ProgressLocation.Notification, title: 'Testing solution...' },
                        () => leetcodeClient.testCode(slug, lang, questionId, code, message.testCases),
                    );

                    if (!results || results.length === 0) {
                        return;
                    }
                    leetCodeSubmissionProvider.show(results[0], true, message.testCases);
                } catch (error) {
                    await promptForOpenOutputChannel(
                        'Failed to test the solution. Please open the output channel for details.',
                        DialogType.error,
                    );
                }
                break;
            }
        }
    }
}

export const leetCodeTestCaseProvider: LeetCodeTestCaseProvider = new LeetCodeTestCaseProvider();
