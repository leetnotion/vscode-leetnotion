import * as vscode from 'vscode';
import { globalState } from '../globalState';
import { hasNotionIntegrationEnabled } from '../utils/settingUtils';

class LeetnotionEngine implements vscode.Disposable {
	private notionIntegrationEnabled: boolean | undefined;
	private listener: vscode.Disposable;

	public constructor() {
		this.reload();
		this.listener = vscode.workspace.onDidChangeConfiguration(
			(event: vscode.ConfigurationChangeEvent) => {
				if (event.affectsConfiguration('leetnotion.enableNotionIntegration')) {
					this.reload();
				}
			},
			this,
		);
	}

	public get localResourceRoots(): vscode.Uri[] {
		return [
			vscode.Uri.joinPath(globalState.getExtensionUri(), 'public'),
			vscode.Uri.joinPath(globalState.getExtensionUri(), 'out', 'src'),
		];
	}

	public dispose(): void {
		this.listener.dispose();
	}

	public reload(): void {
		this.notionIntegrationEnabled = hasNotionIntegrationEnabled();
	}

	public render(webview: vscode.Webview): string {
		if (!this.notionIntegrationEnabled) return '';
		return `<div id="setPropertiesSection">
                    <div id="setPropertiesInputSection">
                        <div id="notes-label">Notes</div>
                        <textarea autofocus cols="50" rows="10" id="notes-input" spellcheck="false"></textarea>
                        <div id="review-container">
                        <label id="review-label" for="absolute-review-date-container">Review on</label>
                        <div id="absolute-review-date-container">
                            <input type="date" id="review-date-input" value="" lang="en-CA" />
                        </div>
                        </div>
                        <div id="optimal-checkbox-container">
                            <input type="checkbox" id="optimal-checkbox-input" />
                            <label for="optimal-checkbox-input">Optimal Solution</label>
                        </div>
                    </div>
                    <label id="tags-label" for="tags-box">Tags</label>
                    <div id="tags-box">
                        <select class="form-control" multiple="multiple" id="tags-select">
                        </select>
                    </div>
                    <button id="setPropertiesButton">Set Properties</button>
                </div>
                <script type="module" src="${this.getLeetnotionScript(webview)}"></script>`;
	}

	private getLeetnotionScript(webview: vscode.Webview): string {
		const onDiskPath = vscode.Uri.joinPath(
			globalState.getExtensionUri(),
			'public',
			'scripts',
			'script.js',
		);
		return webview.asWebviewUri(onDiskPath).toString();
	}

}

export const leetnotionEngine: LeetnotionEngine = new LeetnotionEngine();
