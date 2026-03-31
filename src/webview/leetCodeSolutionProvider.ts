import { ViewColumn } from 'vscode';
import { leetCodePreviewProvider } from './leetCodePreviewProvider';
import { ILeetCodeWebviewOption, LeetCodeWebview } from './LeetCodeWebview';
import { markdownEngine } from './markdownEngine';

interface SolutionData {
	title: string;
	url: string;
	avatar: string;
	authorName: string;
	authorUsername: string;
	views: number;
	createdAt: string;
	tags: string[];
	content: string;
	votes: string;
	lang?: string;
}

class LeetCodeSolutionProvider extends LeetCodeWebview {
	protected readonly viewType: string = 'leetnotion.solution';
	private solution: SolutionData;

	public show(data: SolutionData): void {
		this.solution = data;
		this.showWebviewInternal();
	}

	protected getWebviewOption(): ILeetCodeWebviewOption {
		if (leetCodePreviewProvider.isSideMode()) {
			return {
				title: 'Solution',
				viewColumn: ViewColumn.Two,
				preserveFocus: true,
			};
		} else {
			return {
				title: `Solution: ${this.solution.title}`,
				viewColumn: ViewColumn.One,
			};
		}
	}

	protected getWebviewContent(): string {
		const webview = this.getPanel().webview;
		const styles: string = markdownEngine.getStyles(webview);
		const { title, url, authorName, authorUsername, views, createdAt, tags, content, votes } =
			this.solution;
		const head: string = markdownEngine.render(`# [${title}](${url})`);
		const auth: string = `[${authorName}](https://leetcode.com/${authorUsername}/)`;
		const info: string = markdownEngine.render(
			[
				`| Language |  Author  |  Votes   |`,
				`| :------: | :------: | :------: |`,
				`| ${this.solution.lang || 'N/A'}  | ${auth}  | ${votes} |`,
			].join('\n'),
		);
		const contentWithoutComments: string = this.solution.content.replace(/<!--[\s\S]*?-->/g, '');
		const body: string = markdownEngine.render(contentWithoutComments, {
			lang: this.solution.lang,
			host: 'https://discuss.leetcode.com/',
		});

		const tagsElement: string = tags.map((t: string) => `<code>${t}</code>`).join(' | ');
		const katexScripts: string = markdownEngine.getKatexScripts(webview);
		return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https:; script-src ${webview.cspSource} 'unsafe-inline'; style-src ${webview.cspSource}; font-src ${webview.cspSource};"/>
                ${styles}
                ${katexScripts}
            </head>
            <body class="vscode-body 'scrollBeyondLastLine' 'wordWrap' 'showEditorSelection'" style="tab-size:4">
                ${head}
                ${info}
                ${tagsElement}
                ${body}
                <script>${markdownEngine.getKatexRenderScript()}</script>
            </body>
            </html>
        `;
	}

	protected onDidDisposeWebview(): void {
		super.onDidDisposeWebview();
	}
}

export const leetCodeSolutionProvider: LeetCodeSolutionProvider = new LeetCodeSolutionProvider();
