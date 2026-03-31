import { globalState } from '@/globalState';
import { leetCodeChannel } from '@/leetCodeChannel';
import { JudgeResult } from '@leetnotion/leetcode-api';
import * as os from 'os';
import * as vscode from 'vscode';
import { ViewColumn } from 'vscode';
import { leetnotionClient } from '../leetnotionClient';
import { SetPropertiesMessage } from '../types';
import {
	DialogType,
	openKeybindingsEditor,
	promptForOpenOutputChannel,
	promptHintMessage,
} from '../utils/uiUtils';
import { ILeetCodeWebviewOption, LeetCodeWebview } from './LeetCodeWebview';
import { leetnotionEngine } from './leetnotionEngine';
import { markdownEngine } from './markdownEngine';

class LeetCodeSubmissionProvider extends LeetCodeWebview {
	protected readonly viewType: string = 'leetnotion.submission';
	private result: IResult;

	public show(result: JudgeResult, isTest: boolean = false, testInput?: string): void {
		this.result = isTest
			? this.formatTestResult(result, testInput)
			: this.formatSubmitResult(result);
		this.showWebviewInternal();
		this.showKeybindingsHint();
	}

	protected getWebviewOption(): ILeetCodeWebviewOption {
		return {
			title: 'Submission',
			viewColumn: ViewColumn.Two,
		};
	}

	protected getWebviewContent(): string {
		const webview = this.panel.webview;
		const styles: string = [markdownEngine.getStyles(webview), this.getStyles()].join('\n');
		const scripts: string = this.getScripts();
		const title: string = `## ${this.result.messages[0]}`;
		const messages: string[] = this.result.messages.slice(1).map((m: string) => `* ${m}`);
		const sections: string[] = Object.keys(this.result)
			.filter((key: string) => key !== 'messages')
			.map((key: string) => [`### ${key}`, '```', this.result[key].join('\n'), '```'].join('\n'));
		const body: string = markdownEngine.render([title, ...messages, ...sections].join('\n'));
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
			'hint.commandShortcut',
			'You can customize shortcut key bindings in File > Preferences > Keyboard Shortcuts with query "leetcode".',
			'Open Keybindings',
			(): Promise<any> => openKeybindingsEditor('leetcode solution'),
		);
	}

	private formatTestResult(judge: JudgeResult, testInput?: string): IResult {
		const result: IResult = { messages: [] };

		if (judge.ok) {
			result.messages.push('Finished');
		} else if (judge.error && judge.error.length > 0) {
			const state = judge.state === 'Accepted' ? 'Error' : judge.state || 'Error';
			result.messages.push(state);
		} else {
			// LeetCode API returns "Accepted" even when answers differ during test
			const state = judge.state === 'Accepted' ? 'Wrong Answer' : judge.state || 'Wrong Answer';
			result.messages.push(state);
		}

		if (judge.error && judge.error.length > 0) {
			result['Error'] = judge.error;
		}

		const yourInput = testInput || judge.testcase || '';
		if (yourInput) {
			result['Your Input'] = [yourInput];
		}

		if (judge.stdout) {
			result['Stdout'] = [judge.stdout];
		}

		const answerStr = Array.isArray(judge.answer) ? judge.answer.join('\n') : judge.answer || '';
		if (answerStr) {
			result[`Output (${judge.runtime || 'N/A'})`] = [answerStr];
		}

		const expectedStr = Array.isArray(judge.expected_answer)
			? judge.expected_answer.join('\n')
			: judge.expected_answer || '';
		if (expectedStr) {
			result['Expected Answer'] = [expectedStr];
		}

		return result;
	}

	private formatSubmitResult(judge: JudgeResult): IResult {
		const result: IResult = { messages: [] };

		if (judge.ok) {
			result.messages.push('Accepted');
			result.messages.push(
				`${judge.passed}/${judge.total} cases passed (${judge.runtime || 'N/A'})`,
			);
			if (judge.runtime_percentile) {
				result.messages.push(
					`Your runtime beats ${parseFloat(Number(judge.runtime_percentile).toFixed(2))} % of ${judge.lang} submissions`,
				);
			}
			if (judge.memory && judge.memory_percentile) {
				result.messages.push(
					`Your memory usage beats ${parseFloat(Number(judge.memory_percentile).toFixed(2))} % of ${judge.lang} submissions (${judge.memory})`,
				);
			}
		} else {
			result.messages.push(judge.state || 'Wrong Answer');
			result.messages.push(`${judge.passed}/${judge.total} cases passed`);

			if (judge.error && judge.error.length > 0) {
				result['Error'] = judge.error;
			}
			if (judge.stdout) {
				result['Stdout'] = [judge.stdout];
			}
			if (judge.testcase) {
				result['Testcase'] = [judge.testcase];
			}
			const answerStr = Array.isArray(judge.answer) ? judge.answer.join('\n') : judge.answer || '';
			if (answerStr) result['Answer'] = [answerStr];
			const expectedStr = Array.isArray(judge.expected_answer)
				? judge.expected_answer.join('\n')
				: judge.expected_answer || '';
			if (expectedStr) result['Expected Answer'] = [expectedStr];
		}

		return result;
	}

	private getScripts() {
		let scripts: vscode.Uri[] = [];
		try {
			const scriptPaths = ['jquery.min.js', 'select2.min.js'];
			scripts = scriptPaths.map((p: string) => {
				const onDiskPath = vscode.Uri.joinPath(
					globalState.getExtensionUri(),
					'public',
					'scripts',
					p,
				);
				return this.panel ? this.panel.webview.asWebviewUri(onDiskPath) : onDiskPath;
			});
		} catch (error) {
			leetCodeChannel.appendLine(`[Error] Fail to load built-in markdown style file: ${error}`);
		}
		return scripts
			.map((script: vscode.Uri) => `<script src="${script.toString()}"></script>`)
			.join(os.EOL);
	}

	public getStyles(): string {
		let styles: vscode.Uri[] = [];
		try {
			const stylePaths: string[] = ['select2.min.css', 'style.css'];
			styles = stylePaths.map((p: string) => {
				const onDiskPath = vscode.Uri.joinPath(
					globalState.getExtensionUri(),
					'public',
					'styles',
					p,
				);
				return this.panel ? this.panel.webview.asWebviewUri(onDiskPath) : onDiskPath;
			});
		} catch (error) {
			leetCodeChannel.appendLine(`[Error] Fail to load built-in markdown style file: ${error}`);
		}
		return styles
			.map(
				(style: vscode.Uri) => `<link rel="stylesheet" type="text/css" href="${style.toString()}">`,
			)
			.join(os.EOL);
	}
}

interface IResult {
	[key: string]: string[];
	messages: string[];
}

export const leetCodeSubmissionProvider: LeetCodeSubmissionProvider =
	new LeetCodeSubmissionProvider();
