// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import { globalState } from '../globalState';
import { leetcodeClient } from '../leetCodeClient';
import { DialogType, promptForOpenOutputChannel } from '../utils/uiUtils';

export async function deleteCache(): Promise<void> {
	try {
		await leetcodeClient.deleteCache();
	} catch (error) {
		await promptForOpenOutputChannel(
			'Failed to delete cache. Please open the output channel for details.',
			DialogType.error,
		);
	}
}

export async function refreshData(): Promise<void> {
	await vscode.window.withProgress(
		{ location: vscode.ProgressLocation.Notification, title: 'Refreshing problem data...' },
		async () => {
			// Clear cached metadata so fresh API data is fetched
			globalState.setTopicTags(undefined as any);
			globalState.setProblemRatingMap(undefined as any);
			// Refresh the tree (will fetch fresh API data in phase 2)
			const { leetCodeTreeDataProvider } = await import('../explorer/LeetCodeTreeDataProvider');
			await leetCodeTreeDataProvider.refresh();
		},
	);
	vscode.window.showInformationMessage('Problem data refreshed successfully.');
}
