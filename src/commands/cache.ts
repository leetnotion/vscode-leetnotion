import * as vscode from 'vscode';
import { leetCodeTreeDataProvider } from '../explorer/LeetCodeTreeDataProvider';
import { globalState } from '../globalState';
import { leetcodeClient } from '../leetCodeClient';
import { handleError } from '../utils/errorUtils';

export async function deleteCache(): Promise<void> {
	try {
		await leetcodeClient.deleteCache();
	} catch (error) {
		await handleError(error, 'delete cache');
	}
}

export async function refreshData(): Promise<void> {
	try {
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
	} catch (error) {
		await handleError(error, 'refresh problem data');
	}
}
