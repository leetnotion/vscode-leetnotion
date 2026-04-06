import * as vscode from 'vscode';
import { isAIFeaturesEnabled } from './settingUtils';

const COPILOT_CHAT_EXTENSION_ID = 'github.copilot-chat';

export function isCopilotInstalled(): boolean {
	return vscode.extensions.getExtension(COPILOT_CHAT_EXTENSION_ID) !== undefined;
}

export function isLanguageModelAvailable(): boolean {
	return typeof vscode.lm !== 'undefined' && typeof vscode.lm.selectChatModels === 'function';
}

export function isAIAvailable(): boolean {
	return isAIFeaturesEnabled() && isLanguageModelAvailable() && isCopilotInstalled();
}

export async function getLanguageModel(): Promise<vscode.LanguageModelChat | undefined> {
	if (!isAIAvailable()) {
		return undefined;
	}
	const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
	return models.length > 0 ? models[0] : undefined;
}

export async function sendChatRequest(
	prompt: string,
	systemPrompt?: string,
): Promise<string | undefined> {
	const model = await getLanguageModel();
	if (!model) {
		return undefined;
	}
	const messages: vscode.LanguageModelChatMessage[] = [];
	if (systemPrompt) {
		messages.push(vscode.LanguageModelChatMessage.Assistant(systemPrompt));
	}
	messages.push(vscode.LanguageModelChatMessage.User(prompt));
	const response = await model.sendRequest(messages);
	let result = '';
	for await (const chunk of response.text) {
		result += chunk;
	}
	return result;
}
