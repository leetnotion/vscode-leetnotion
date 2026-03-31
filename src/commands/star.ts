// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { customCodeLensProvider } from '../codelens/CustomCodeLensProvider';
import { LeetCodeNode } from '../explorer/LeetCodeNode';
import { leetCodeTreeDataProvider } from '../explorer/LeetCodeTreeDataProvider';
import { explorerNodeManager } from '../explorer/explorerNodeManager';
import { leetcodeClient } from '../leetCodeClient';
import { leetCodeManager } from '../leetCodeManager';
import { hasStarShortcut } from '../utils/settingUtils';
import { promptForSignIn } from '../utils/uiUtils';

export async function addFavorite(node: LeetCodeNode): Promise<void> {
	if (!leetCodeManager.getUser()) {
		promptForSignIn();
		return;
	}
	const liveNode = explorerNodeManager.getNodeById(node.id);
	if (!liveNode) return;
	liveNode.isFavorite = true;
	explorerNodeManager.updateFavoriteCategory(liveNode.id, true);
	leetcodeClient.toggleFavorite(liveNode.id, true);
	leetCodeTreeDataProvider.fireChange();
	if (hasStarShortcut()) {
		customCodeLensProvider.refresh();
	}
}

export async function removeFavorite(node: LeetCodeNode): Promise<void> {
	if (!leetCodeManager.getUser()) {
		promptForSignIn();
		return;
	}
	const liveNode = explorerNodeManager.getNodeById(node.id);
	if (!liveNode) return;
	liveNode.isFavorite = false;
	explorerNodeManager.updateFavoriteCategory(liveNode.id, false);
	leetcodeClient.toggleFavorite(liveNode.id, false);
	leetCodeTreeDataProvider.fireChange();
	if (hasStarShortcut()) {
		customCodeLensProvider.refresh();
	}
}
