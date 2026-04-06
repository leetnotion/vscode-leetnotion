import { leetCodeChannel } from '@/leetCodeChannel';
import { leetcodeClient } from '@/leetCodeClient';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { ViewColumn } from 'vscode';
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
		const title: string = markdownEngine.render(`## ${this.node.name}`);
		const label: string = markdownEngine.render(`### Test Cases`);
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
                    #testBtn {
                        border: 0;
                        margin: 1rem 0;
                        padding: 0.4rem 1.5rem;
                        font-size: 14px;
                        color: white;
                        background-color: var(--vscode-button-background);
                        cursor: pointer;
                    }
                    #testBtn:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    #testBtn:active {
                        border: 0;
                    }
                </style>
            </head>
            <body class="vscode-body 'scrollBeyondLastLine' 'wordWrap' 'showEditorSelection'" style="tab-size:4">
                ${title}
                ${label}
                <textarea id="testcases" spellcheck="false">${escapedTestCase}</textarea>
                <button id="testBtn">Test</button>
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

	protected async onDidReceiveMessage(message: {
		command: string;
		testCases: string;
	}): Promise<void> {
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
					const questionId = this.node.questionId;

					if (!slug || !lang || isNaN(questionId)) {
						vscode.window.showErrorMessage('Could not determine problem metadata.');
						return;
					}

					leetCodeChannel.appendLine(`[Test] file: ${this.filePath}`);
					leetCodeChannel.appendLine(
						`[Test] slug: ${slug}, lang: ${lang}, questionId: ${questionId}`,
					);

					const results = await vscode.window.withProgress(
						{ location: vscode.ProgressLocation.Notification, title: 'Testing solution...' },
						() => leetcodeClient.testCode(slug, lang, questionId, code, message.testCases),
					);

					if (!results || results.length === 0) {
						return;
					}
					leetCodeSubmissionProvider.show(
						results[0],
						true,
						message.testCases,
						code,
						slug,
						this.node.name,
					);
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
