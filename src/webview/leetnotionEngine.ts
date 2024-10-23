import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { hasNotionIntegrationEnabled } from "../utils/settingUtils";
import { leetCodeChannel } from "../leetCodeChannel";
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

    public render(): string {
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
                <script type="module" src="${this.getLeetnotionScript()}"></script>
                <script type="module" src="${this.getVscodeComponentsUri()}"></script>`
    }

    public getStyles(): string {
        let styles: vscode.Uri[] = [];
        try {
            const stylePaths: string[] = ['select2.min.css', 'style.css'];
            styles = stylePaths.map((p: string) => vscode.Uri.file(path.join(globalState.getExtensionUri().fsPath, "public", "styles", p)).with({ scheme: "vscode-resource" }));
        } catch (error) {
            leetCodeChannel.appendLine("[Error] Fail to load built-in markdown style file.");
        }
        return styles.map((style: vscode.Uri) => `<link rel="stylesheet" type="text/css" href="${style.toString()}">`).join(os.EOL);
    }

    public getScripts() {
        let scripts: vscode.Uri[] = [];
        try {
            const scriptPaths = ["jquery.min.js", "select2.min.js"];
            scripts = scriptPaths.map((p: string) => vscode.Uri.file(path.join(globalState.getExtensionUri().fsPath, "public", "scripts", p)).with({ scheme: "vscode-resource" }));
        } catch (error) {
            leetCodeChannel.appendLine("[Error] Fail to load built-in markdown style file.");
        }
        return scripts.map((script: vscode.Uri) => `<script src="${script.toString()}"></script>`).join(os.EOL);
    }

    private getLeetnotionScript(): string {
        return vscode.Uri.file(path.join(globalState.getExtensionUri().fsPath, "public", "scripts", "script.js")).with({ scheme: "vscode-resource" }).toString();
    }

    private getVscodeComponentsUri(): string {
        return vscode.Uri.file(path.join(globalState.getExtensionUri().fsPath, "public", "scripts", "vscode-components.js")).with({ scheme: "vscode-resource" }).toString();
    }
}

export const leetnotionEngine: LeetnotionEngine = new LeetnotionEngine();
