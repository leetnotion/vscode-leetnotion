import { globalState } from "./globalState";
import { InputBoxOptions, ProgressLocation, window } from "vscode";
import { leetCodeChannel } from "./leetCodeChannel";
import { DialogType, promptForOpenOutputChannel } from "./utils/uiUtils";
import { getWorkspaceConfiguration } from "./utils/settingUtils";
import { leetnotionClient } from "./leetnotionClient";
import { leetcodeClient } from "./leetCodeClient";
import { leetCodeManager } from "./leetCodeManager";

class LeetnotionManager {
    public async enableNotionIntegration(): Promise<void> {
        const accessToken = await this.getAccessToken();
        try {
            if (!accessToken || accessToken === "") {
                promptForOpenOutputChannel("Notion integration disabled. To enable notion integration run 'Integrate notion' leetnotion command.", DialogType.info);
                this.disableNotionIntegration();
                return;
            }
            if (!(await leetnotionClient.isValidAccessToken(accessToken))) {
                promptForOpenOutputChannel("Invalid notion access token.", DialogType.error);
                leetCodeChannel.appendLine("Invalid notion access token. Ensure you have correct leetcode template and integrated the access token to your template.")
                this.disableNotionIntegration();
                return;
            }
            globalState.setNotionAccessToken(accessToken);
            leetnotionClient.initialize();
            const previousQuestionsDatabaseId = globalState.getQuestionsDatabaseId();
            await leetnotionClient.setDatabaseIds();
            globalState.setNotionIntegrationStatus("pending");
            if (!previousQuestionsDatabaseId || previousQuestionsDatabaseId === globalState.getQuestionsDatabaseId()) {
                await this.updateTemplatePages();
            }
            globalState.setNotionIntegrationStatus("done");
        } catch (error) {
            leetCodeChannel.appendLine(`Error enabling notion integration: ${error}`);
        }
    }

    private disableNotionIntegration(): void {
        getWorkspaceConfiguration().update("enableNotionIntegration", false);
    }

    private async getAccessToken(): Promise<string | undefined> {
        try {
            const accessToken = globalState.getNotionAccessToken();
            const inputOptions: InputBoxOptions = {
                placeHolder: "Eg: secret_123...",
                prompt: "Enter your notion access token",
                password: true,
                ignoreFocusOut: true,
                validateInput: (str: string): string | undefined => (str && str.trim() ? undefined : 'The input must not be empty')
            }
            if (!accessToken) {
                return await window.showInputBox(inputOptions);
            }
            const options = [
                'Use existing notion access token',
                'Use a new notion access token'
            ];
            const option = await window.showQuickPick(
                options,
                {
                    placeHolder: "There is already and existing notion access token"
                }
            )
            return option === options[0] ? accessToken : await window.showInputBox(inputOptions);
        } catch (error) {
            leetCodeChannel.appendLine(error);
            return undefined;
        }
    }

    public async updateTemplatePages(): Promise<void> {
        const totalNoOfPages = await leetcodeClient.getNoOfProblems();
        leetCodeChannel.appendLine("Started fetching template pages from notion.")
        await window.withProgress(
            {
                location: ProgressLocation.Notification,
                cancellable: false,
                title: 'Loading questions from notion. Please wait...',
            },
            async progress => {
                progress.report({ increment: 0 })
                await leetnotionClient.updateTemplateInformation(() => {
                    progress.report({ increment: 10000 / totalNoOfPages });
                    leetCodeChannel.appendLine(`Collected 100 pages from notion`);
                });
            }
        )
    }

    public async clearAllData(): Promise<void> {
        try {
            await leetCodeManager.signOut();
            globalState.clearAllNotionDetails()
            leetnotionClient.signOut();
        } catch (error) {

        }
    }
}

export const leetnotionManager: LeetnotionManager = new LeetnotionManager();
