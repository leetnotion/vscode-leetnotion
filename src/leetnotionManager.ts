import { PageObjectResponse, QueryRichText } from '@leetnotion/notion-api';
import * as fse from 'fs-extra';
import { InputBoxOptions, OpenDialogOptions, ProgressLocation, Uri, window } from 'vscode';
import { globalState } from './globalState';
import { leetCodeChannel } from './leetCodeChannel';
import { leetcodeClient } from './leetCodeClient';
import { leetCodeManager } from './leetCodeManager';
import { leetnotionClient } from './leetnotionClient';
import { templateUpdateSession } from './modules/leetnotion/session';
import { IProblem } from './shared';
import { LeetcodeSubmission } from './types';
import { getWorkspaceConfiguration, hasNotionIntegrationEnabled } from './utils/settingUtils';
import {
	DialogType,
	getBelongingWorkspaceFolderUri,
	promptForOpenOutputChannel,
} from './utils/uiUtils';

class LeetnotionManager {
	public async enableNotionIntegration(): Promise<void> {
		const accessToken = await this.getAccessToken();
		try {
			if (!accessToken || accessToken === '') {
				promptForOpenOutputChannel(
					"Skipping Notion integration. For Notion integration, run 'Integrate Notion' command (Cmd/Ctrl + Shift + P).",
					DialogType.info,
				);
				this.disableNotionIntegration();
				return;
			}
			if (!(await leetnotionClient.isValidAccessToken(accessToken))) {
				promptForOpenOutputChannel('Invalid notion access token.', DialogType.error);
				leetCodeChannel.appendLine(
					'Invalid notion access token. Ensure you have correct leetcode template and integrated the access token to your template.',
				);
				this.disableNotionIntegration();
				return;
			}
			await globalState.setNotionAccessToken(accessToken);
			leetnotionClient.initialize();
			const previousQuestionsDatabaseId = globalState.getQuestionsDatabaseId();
			await leetnotionClient.setDatabaseIds();
			if (
				!previousQuestionsDatabaseId ||
				previousQuestionsDatabaseId !== globalState.getQuestionsDatabaseId()
			) {
				await templateUpdateSession.close();
				await globalState.setNotionIntegrationStatus('pending');
				await this.updateNotionInfo();
				await window.showInformationMessage('Notion integration completed 🎉');
			}
			await globalState.setNotionIntegrationStatus('done');
		} catch (error) {
			leetCodeChannel.appendLine(`Error enabling notion integration: ${error}`);
		}
	}

	private disableNotionIntegration(): void {
		getWorkspaceConfiguration().update('enableNotionIntegration', false);
	}

	private async getAccessToken(): Promise<string | undefined> {
		try {
			const accessToken = globalState.getNotionAccessToken();
			const inputOptions: InputBoxOptions = {
				placeHolder: 'Eg: secret_123...',
				prompt: 'Enter your notion access token',
				password: true,
				ignoreFocusOut: true,
				validateInput: (str: string): string | undefined =>
					str && str.trim() ? undefined : 'The input must not be empty',
			};
			if (!accessToken) {
				return await window.showInputBox(inputOptions);
			}
			const options = ['Use existing notion access token', 'Use a new notion access token'];
			const option = await window.showQuickPick(options, {
				placeHolder: 'There is already and existing notion access token',
			});
			return option === options[0] ? accessToken : await window.showInputBox(inputOptions);
		} catch (error) {
			leetCodeChannel.appendLine(error);
			return undefined;
		}
	}

	public async updateNotionInfo(): Promise<void> {
		const totalNoOfPages = await leetcodeClient.getNoOfProblems();
		leetCodeChannel.appendLine('Started fetching template pages from notion.');
		await window.withProgress(
			{
				location: ProgressLocation.Notification,
				cancellable: false,
				title: 'Loading questions from notion. Please wait...',
			},
			async (progress) => {
				progress.report({ increment: 0 });
				await leetnotionClient.updateTemplateInformation(() => {
					progress.report({ increment: 10000 / totalNoOfPages });
					leetCodeChannel.appendLine(`Collected 100 pages from notion`);
				});
			},
		);
	}

	public async uploadSubmissions() {
		try {
			if (!hasNotionIntegrationEnabled()) {
				leetCodeChannel.appendLine(
					`Notion integration not enabled. Enable notion integration and complete setup to upload submissions.`,
				);
				promptForOpenOutputChannel(`Notion integration not enabled.`, DialogType.error);
				return;
			}
			const submissions = await this.getLeetcodeSubmissions();
			let notionSubmissionPages: PageObjectResponse[] = [];
			let notionSubmissionsCount = 0;
			await window.withProgress(
				{
					location: ProgressLocation.Notification,
					cancellable: true,
					title: 'Collecting existing submissions from notion',
				},
				async (progress) => {
					notionSubmissionPages = await leetnotionClient.getSubmissionPages((response) => {
						notionSubmissionsCount += response.results.length;
						progress.report({
							message: `${notionSubmissionsCount} collected`,
						});
					});
				},
			);
			const existingSubmissions = new Set<string>();
			notionSubmissionPages.forEach((submissionPage) => {
				const submissionIdProperty = submissionPage.properties['Submission ID'] as QueryRichText;
				const submissionId = submissionIdProperty.rich_text[0].plain_text;
				if (!submissionId) {
					return;
				}
				existingSubmissions.add(submissionId);
			});
			const newSubmissions = submissions.filter(
				(submission) => !existingSubmissions.has(submission.id.toString()),
			);
			await window.withProgress(
				{
					location: ProgressLocation.Notification,
					cancellable: true,
					title: 'Adding submissions to notion',
				},
				async (progress, cancellationToken) => {
					let count = 0;
					await leetnotionClient.addSubmissions(newSubmissions, () => {
						count += 1;
						progress.report({
							message: `(${count}/${newSubmissions.length}) added`,
							increment: (1 / newSubmissions.length) * 100,
						});
						if (cancellationToken.isCancellationRequested) {
							throw new Error(`adding-submissions-cancelled`);
						}
					});
				},
			);
		} catch (error) {
			if (error.message.includes('adding-submissions-cancelled')) {
				promptForOpenOutputChannel(`Adding submissions cancelled`, DialogType.completed);
				return;
			}
			leetCodeChannel.appendLine(`Failed to upload submissions: ${error}`);
			promptForOpenOutputChannel(`Failed to upload submissions`, DialogType.error);
		}
	}

	public async getLeetcodeSubmissions() {
		const defaultUri: Uri | undefined = getBelongingWorkspaceFolderUri(undefined);
		const options: OpenDialogOptions = {
			defaultUri,
			canSelectFiles: true,
			canSelectFolders: false,
			canSelectMany: false,
			openLabel: 'Select',
			filters: {
				JSON: ['json'],
			},
			title: 'Select submissions.json where all your leetcode submissions contain.',
		};
		const submissionsFile: Uri[] | undefined = await window.showOpenDialog(options);
		if (submissionsFile && submissionsFile.length) {
			const submissions = fse.readJSONSync(submissionsFile[0].fsPath) as LeetcodeSubmission[];
			return submissions;
		}
		throw new Error(`Error at getting submission from submissions.json`);
	}

	public async addNewProblemsToNotion(newProblems: IProblem[]): Promise<void> {
		if (!hasNotionIntegrationEnabled()) {
			return;
		}
		const questionNumberPageIdMapping = globalState.getQuestionNumberPageIdMapping();
		if (!questionNumberPageIdMapping) {
			return;
		}
		const slugs = newProblems.map((p) => p.slug).filter(Boolean);
		if (slugs.length === 0) {
			return;
		}
		try {
			leetCodeChannel.appendLine(
				`[Notion] Fetching details for ${slugs.length} new problem(s)...`,
			);
			const leetcodeProblems = await leetcodeClient.getLeetcodeProblemsBySlugs(slugs);
			const problemsToAdd = leetcodeProblems.filter(
				({ questionFrontendId }) => !(questionFrontendId in questionNumberPageIdMapping),
			);
			if (problemsToAdd.length === 0) {
				leetCodeChannel.appendLine('[Notion] No new problems to add to Notion.');
				return;
			}
			leetCodeChannel.appendLine(
				`[Notion] Adding ${problemsToAdd.length} new problem(s) to Notion...`,
			);
			await leetnotionClient.addProblems(problemsToAdd, (response) => {
				const questionNumber = response.properties['Question Number'].number;
				if (questionNumber) {
					questionNumberPageIdMapping[questionNumber.toString()] = response.id;
					globalState.setQuestionNumberPageIdMapping(questionNumberPageIdMapping);
				}
				const title = response.properties.Name.title[0].text.content;
				leetCodeChannel.appendLine(`[Notion] Added problem: ${title}`);
			});
			leetCodeChannel.appendLine(
				`[Notion] Successfully added ${problemsToAdd.length} new problem(s).`,
			);

			// Update the newly added problems to link similar questions
			leetCodeChannel.appendLine(
				`[Notion] Updating ${problemsToAdd.length} new problem(s) to link similar questions...`,
			);
			const problemsToUpdate = [...problemsToAdd].sort(
				(a, b) => parseInt(b.questionFrontendId) - parseInt(a.questionFrontendId),
			);
			await leetnotionClient.updateProblems(problemsToUpdate, (response) => {
				const title = response.properties.Name.title[0].text.content;
				leetCodeChannel.appendLine(`[Notion] Updated problem: ${title}`);
			});
			leetCodeChannel.appendLine(
				`[Notion] Successfully updated ${problemsToUpdate.length} problem(s) with similar questions.`,
			);
		} catch (error) {
			leetCodeChannel.appendLine(
				`[Notion] Failed to add new problems: ${(error as Error).message}`,
			);
		}
	}

	public async clearAllData(): Promise<void> {
		try {
			await leetCodeManager.signOut();
			await globalState.clearAllExtensionData();
			templateUpdateSession.close();
			leetnotionClient.signOut();
		} catch (error) {
			leetCodeChannel.appendLine(`Error during clearing data: ${(error as Error).message}`);
		}
	}
}

export const leetnotionManager: LeetnotionManager = new LeetnotionManager();
