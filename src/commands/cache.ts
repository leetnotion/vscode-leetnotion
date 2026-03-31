import { leetCodeChannel } from '@/leetCodeChannel';
import * as vscode from 'vscode';
import { leetCodeTreeDataProvider } from '../explorer/LeetCodeTreeDataProvider';
import { globalState } from '../globalState';
import { leetcodeClient } from '../leetCodeClient';
import { leetCodeManager } from '../leetCodeManager';
import { DialogType, promptForOpenOutputChannel, promptForSignIn } from '../utils/uiUtils';

export async function deleteCache(): Promise<void> {
	if (!leetCodeManager.getUser()) {
		promptForSignIn();
		return;
	}
	try {
		await leetcodeClient.deleteCache();
	} catch (error) {
		await promptForOpenOutputChannel(
			'Failed to delete cache. Please open the output channel for details.',
			DialogType.error,
		);
		leetCodeChannel.appendLine(`Error deleting cache: ${(error as Error).message}`);
	}
}

export async function refreshData(): Promise<void> {
	if (!leetCodeManager.getUser()) {
		promptForSignIn();
		return;
	}
	await vscode.window.withProgress(
		{ location: vscode.ProgressLocation.Notification, title: 'Refreshing problem data...' },
		async () => {
			// Clear cached metadata so fresh API data is fetched
			globalState.setTopicTags(undefined as any);
			globalState.setProblemRatingMap(undefined as any);
			// Refresh the tree (will fetch fresh API data in phase 2)
			await leetCodeTreeDataProvider.refresh();
		},
	);
	vscode.window.showInformationMessage('Problem data refreshed successfully.');
}
