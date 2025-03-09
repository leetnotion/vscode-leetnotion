import * as path from "path";
import * as vscode from "vscode";
import { hasNotionIntegrationEnabled } from "../utils/settingUtils";
import { globalState } from "../globalState";

class LeetnotionEngine implements vscode.Disposable {

    private notionIntegrationEnabled: boolean;
    private listener: vscode.Disposable;

    public constructor() {
        this.reload();
        this.listener = vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
            if (event.affectsConfiguration("leetnotion.enableNotionIntegration")) {
                this.reload();
            }
        }, this);
    }

    public get localResourceRoots(): vscode.Uri[] {
        return [
            vscode.Uri.joinPath(globalState.getExtensionUri(), "public"),
            vscode.Uri.joinPath(globalState.getExtensionUri(), "out", "src")
        ];
    }

    public dispose(): void {
        this.listener.dispose();
    }

    public reload(): void {
        this.notionIntegrationEnabled = hasNotionIntegrationEnabled();
    }

    public render(webview: vscode.Webview): string {
        if(!this.notionIntegrationEnabled) return "";
        return `<div id="setPropertiesSection">
                    <div id="setPropertiesInputSection">
                        <vscode-text-area autofocus cols="50" rows="10" resize="both" id="notes-input">
                            <div id="notes-label">Notes</div>
                        </vscode-text-area>
                        <div id="review-container">
                        <label id="review-label" for="absolute-review-date-container">Review on</label>
                        <div id="absolute-review-date-container">
                            <input type="date" id="review-date-input" value="" />
                        </div>
                        </div>
                        <vscode-checkbox id="optimal-checkbox-input">Optimal Solution</vscode-checkbox>
                    </div>
                    <vscode-divider></vscode-divider>
                    <label id="tags-label" for="tags-box">Tags</label>
                    <div id="tags-box">
                        <select class="form-control" multiple="multiple" id="tags-select">
                        </select>
                    </div>
                    <vscode-divider></vscode-divider>
                    <vscode-button id="setPropertiesButton" appearance="primary">Set Properties</vscode-button>
                </div>
                <script type="module" src="${this.getLeetnotionScript(webview)}"></script>
                <script type="module" src="${this.getVscodeComponentsUri(webview)}"></script>`
    }

    private getLeetnotionScript(webview: vscode.Webview): string {
        const onDiskPath = vscode.Uri.joinPath(
            globalState.getExtensionUri(),
            "public",
            "scripts",
            "script.js",
        );
        return webview.asWebviewUri(onDiskPath).toString();
    }

    private getVscodeComponentsUri(webview: vscode.Webview): string {
        const onDiskPath = vscode.Uri.joinPath(
            globalState.getExtensionUri(),
            "public",
            "scripts",
            "vscode-components.js",
        );
        return webview.asWebviewUri(onDiskPath).toString();
    }
}

export const leetnotionEngine: LeetnotionEngine = new LeetnotionEngine();
