import { explorerNodeManager } from '@/explorer/explorerNodeManager';
import { globalState } from '@/globalState';
import { NextChallenge, QuestionDetail, SimilarQuestion } from '@leetnotion/leetcode-api';
import { commands, ViewColumn } from 'vscode';
import { Category, IProblem } from '../shared';
import { ILeetCodeWebviewOption, LeetCodeWebview } from './LeetCodeWebview';
import { markdownEngine } from './markdownEngine';

class LeetCodePreviewProvider extends LeetCodeWebview {
	protected readonly viewType: string = 'leetnotion.preview';
	private node: IProblem;
	private description: IDescription;
	private sideMode: boolean = false;

	public isSideMode(): boolean {
		return this.sideMode;
	}

	public show(problemData: QuestionDetail, node: IProblem, isSideMode: boolean = false): void {
		this.description = this.parseDescription(problemData, node);
		this.node = node;
		this.sideMode = isSideMode;
		this.showWebviewInternal();
	}

	public isShowingNode(node: IProblem): boolean {
		return !!this.panel && this.node?.slug === node.slug;
	}

	public revealAsSide(): void {
		if (!this.panel) {
			return;
		}
		this.sideMode = true;
		this.panel.title = 'Description';
		this.panel.webview.html = this.getWebviewContent();
		this.panel.reveal(ViewColumn.Two, true);
	}

	protected getWebviewOption(): ILeetCodeWebviewOption {
		if (!this.sideMode) {
			return {
				title: `${this.node.name}: Preview`,
				viewColumn: ViewColumn.One,
			};
		} else {
			return {
				title: 'Description',
				viewColumn: ViewColumn.Two,
				preserveFocus: true,
			};
		}
	}

	protected getWebviewContent(): string {
		const webview = this.getPanel().webview;
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
                    padding: 0.4rem 1.5rem;
                    font-size: 14px;
                    color: white;
                    background-color: var(--vscode-button-background);
                    cursor: pointer;
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
		if (!this.node.rating) {
			info = markdownEngine.render(
				[
					`| Category | Difficulty | Likes | Dislikes |`,
					`| :------: | :--------: | :---: | :------: |`,
					`| ${category} | ${difficulty} | ${likes} | ${dislikes} |`,
				].join('\n'),
			);
		} else {
			const contestCell = this.node.contestName
				? `<a href="#" onclick="onContestClick('${this.node.contestName.replace(/'/g, "\\'")}')">${this.node.contestName}</a>`
				: '-';
			info = `<table>
                <thead>
                    <tr><th>Category</th><th>Difficulty</th><th>Likes</th><th>Dislikes</th><th>Rating</th><th>Contest</th><th>Index</th></tr>
                </thead>
                <tbody>
                    <tr><td align="center">${category}</td><td align="center">${difficulty}</td><td align="center">${likes}</td><td align="center">${dislikes}</td><td align="center">${this.node.rating}</td><td align="center">${contestCell}</td><td align="center">${this.node.problemIndex}</td></tr>
                </tbody>
            </table>`;
		}
		const tags: string = [
			`<details>`,
			`<summary><strong>🏷️&nbsp;&nbsp;Topics</strong></summary>`,
			this.description.tags
				.map((t: string) => `<a href="#" onclick="onTagClick('${t}')"><code>${t}</code></a>`)
				.join(' | '),
			`</details>`,
		].join('\n');
		const companies: string = [
			`<details>`,
			`<summary><strong>🏢&nbsp;&nbsp;Companies</strong></summary>`,
			this.description.companies
				.map((c: string) => `<a href="#" onclick="onCompanyClick('${c}')"><code>${c}</code></a>`)
				.join(' | '),
			`</details>`,
		].join('\n');

		const hints: string = this.description.hints
			.map(
				(h: string, i: number) => `<details>
            <summary><strong>💡&nbsp;&nbsp;Hint ${i + 1}</strong></summary><p>${h}</p>
        </details><hr />`,
			)
			.join('\n');

		const similarQuestions: string = this.description.similarQuestions
			.map((q: SimilarQuestion) => {
				const colorVar: Record<string, string> = {
					easy: 'var(--vscode-charts-green)',
					medium: 'var(--vscode-charts-yellow)',
					hard: 'var(--vscode-charts-red)',
				};
				const color = colorVar[q.difficulty.toLowerCase()] || 'inherit';
				return `<li class="similar-question" onclick="onQuestionClick('${q.titleSlug}')" style="color: ${color}; display: flex; justify-content: space-between;"><span>${q.title}</span><span>${q.difficulty}</span></li>`;
			})
			.join('\n');
		const similar: string = `<details>
            <summary><strong>☑️&nbsp;&nbsp;Similar Questions</strong></summary><ul>${similarQuestions}</ul>
        </details><hr />`;

		const nextChallenges: string = this.description.nextChallengeQuestions
			.map((q: NextChallenge) => {
				const colorVar: Record<string, string> = {
					easy: 'var(--vscode-charts-green)',
					medium: 'var(--vscode-charts-yellow)',
					hard: 'var(--vscode-charts-red)',
				};
				const color = colorVar[q.difficulty.toLowerCase()] || 'inherit';
				return `<li class="similar-question" onclick="onQuestionClick('${q.titleSlug}')" style="color: ${color}; display: flex; justify-content: space-between;"><span>${q.title}</span><span>${q.difficulty}</span></li>`;
			})
			.join('\n');
		const nextChallenge: string = `<details>
            <summary><strong>💪🏻&nbsp;&nbsp;Next Challenges</strong></summary><ul>${nextChallenges}</ul>
        </details><hr />`;

		const links: string = markdownEngine.render(
			`[Submissions](${this.getSubmissionsLink(url)}) | [Solution](${this.getSolutionsLink(url)})`,
		);
		const katexScripts: string = markdownEngine.getKatexScripts(webview);
		return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https:; script-src ${webview.cspSource} 'unsafe-inline'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource};"/>
                ${markdownEngine.getStyles(webview)}
                ${katexScripts}
                ${!this.sideMode ? button.style : ''}
                <style>
                    code { white-space: pre-wrap; }
                    summary { cursor: pointer; list-style: none; }
                    summary::-webkit-details-marker { display: none; }
                    ul { padding-left: 1em; }
                    .similar-question { cursor: pointer; padding: 4px 8px; border-radius: 4px; }
                    .similar-question:hover { background-color: var(--vscode-list-hoverBackground); }
                </style>
            </head>
            <body>
                ${head}
                ${info}
                ${body}
                <hr />
                ${tags}
                <hr />
                ${companies}
                <hr />
                ${this.description.hints.length > 0 ? hints : ''}
                ${this.description.similarQuestions.length > 0 ? similar : ''}
                ${this.description.nextChallengeQuestions.length > 0 ? nextChallenge : ''}
                ${links}
                ${!this.sideMode ? button.element : ''}
                <script>
                    const vscode = acquireVsCodeApi();
                    ${!this.sideMode ? button.script : ''}
                    ${markdownEngine.getKatexRenderScript()}
                    function onTagClick(tag) {
                        vscode.postMessage({ command: 'TagClick', tag });
                    }
                    function onCompanyClick(company) {
                        vscode.postMessage({ command: 'CompanyClick', company });
                    }
                    function onQuestionClick(slug) {
                        vscode.postMessage({ command: 'QuestionClick', slug });
                    }
                    function onContestClick(contest) {
                        vscode.postMessage({ command: 'ContestClick', contest });
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
		switch (message.command) {
			case 'ShowProblem': {
				await commands.executeCommand('leetnotion.showProblem', this.node);
				break;
			}
			case 'TagClick': {
				explorerNodeManager.revealNode(`${Category.Tag}#${message.tag}`);
				break;
			}
			case 'CompanyClick': {
				explorerNodeManager.revealNode(`${Category.Company}#${message.company}`);
				break;
			}
			case 'ContestClick': {
				explorerNodeManager.revealNode(`${Category.Contests}#${message.contest}`);
				break;
			}
			case 'QuestionClick': {
				const mapping = globalState.getTitleSlugQuestionNumberMapping();
				const id = mapping?.[message.slug];
				if (id) {
					const node = explorerNodeManager.getNodeById(id);
					if (node) {
						await commands.executeCommand('leetnotion.previewProblem', node);
						explorerNodeManager.revealNode(id);
					}
				}
				break;
			}
		}
	}

	// private async hideSideBar(): Promise<void> {
	//     await commands.executeCommand("workbench.action.focusSideBar");
	//     await commands.executeCommand("workbench.action.toggleSidebarVisibility");
	// }

	private parseDescription(problemData: QuestionDetail, problem: IProblem): IDescription {
		const url = `https://leetcode.com/problems/${problemData.question.titleSlug}/description/`;
		const body = (problemData.question.content || '').replace(
			/<pre>[\r\n]*([^]+?)[\r\n]*<\/pre>/g,
			'<pre><code>$1</code></pre>',
		);
		const similarQuestions: SimilarQuestion[] = problemData.question.similarQuestionList;
		const stats = problemData.question.stats ? JSON.parse(problemData.question.stats) : {};
		return {
			id: problemData.question.questionFrontendId,
			title: `${problemData.question.questionFrontendId}. ${problemData.question.title}`,
			url,
			tags: problem.tags,
			companies: problem.companies,
			category: problemData.question.categoryTitle,
			difficulty: `${problemData.question.difficulty} ${stats.acRate ? `(${stats.acRate})` : ''}`,
			likes: String(problemData.question.likes || 0),
			dislikes: String(problemData.question.dislikes || 0),
			body,
			hints: problemData.question.hints || [],
			similarQuestions: similarQuestions,
			nextChallengeQuestions: problemData.question.nextChallenges || [],
		};
	}

	private getSolutionsLink(url: string): string {
		return url.replace('/description/', '/solutions/') + '?source=vscode';
	}
	private getSubmissionsLink(url: string): string {
		return url.replace('/description/', '/submissions/') + '?source=vscode';
	}
}

interface IDescription {
	id: string;
	title: string;
	url: string;
	tags: string[];
	companies: string[];
	category: string;
	difficulty: string;
	likes: string;
	dislikes: string;
	body: string;
	hints: string[];
	similarQuestions: SimilarQuestion[];
	nextChallengeQuestions: NextChallenge[];
}

interface IWebViewMessage {
	command: string;
	tag?: string;
	company?: string;
	slug?: string;
	contest?: string;
}

export const leetCodePreviewProvider: LeetCodePreviewProvider = new LeetCodePreviewProvider();
