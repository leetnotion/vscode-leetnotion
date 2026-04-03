import { customCodeLensProvider } from '../codelens/CustomCodeLensProvider';
import { LeetCodeNode } from '../explorer/LeetCodeNode';
import { leetCodeTreeDataProvider } from '../explorer/LeetCodeTreeDataProvider';
import { explorerNodeManager } from '../explorer/explorerNodeManager';
import { leetcodeClient } from '../leetCodeClient';
import { hasStarShortcut } from '../utils/settingUtils';

export async function addFavorite(node: LeetCodeNode): Promise<void> {
	const liveNode = explorerNodeManager.getNodeById(node.id);
	if (!liveNode) return;
	liveNode.isFavorite = true;
	explorerNodeManager.updateFavoriteCategory(liveNode.id, true);
	leetcodeClient.toggleFavorite(String(liveNode.questionId), true, () => {
		liveNode.isFavorite = false;
		explorerNodeManager.updateFavoriteCategory(liveNode.id, false);
		leetCodeTreeDataProvider.fireChange();
		if (hasStarShortcut()) {
			customCodeLensProvider.refresh();
		}
	});
	leetCodeTreeDataProvider.fireChange();
	if (hasStarShortcut()) {
		customCodeLensProvider.refresh();
	}
}

export async function removeFavorite(node: LeetCodeNode): Promise<void> {
	const liveNode = explorerNodeManager.getNodeById(node.id);
	if (!liveNode) return;
	liveNode.isFavorite = false;
	explorerNodeManager.updateFavoriteCategory(liveNode.id, false);
	leetcodeClient.toggleFavorite(String(liveNode.questionId), false, () => {
		liveNode.isFavorite = true;
		explorerNodeManager.updateFavoriteCategory(liveNode.id, true);
		leetCodeTreeDataProvider.fireChange();
		if (hasStarShortcut()) {
			customCodeLensProvider.refresh();
		}
	});
	leetCodeTreeDataProvider.fireChange();
	if (hasStarShortcut()) {
		customCodeLensProvider.refresh();
	}
}
