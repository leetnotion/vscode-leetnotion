import * as fse from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { explorerNodeManager } from '../explorer/explorerNodeManager';
import { leetCodeTreeDataProvider } from '../explorer/LeetCodeTreeDataProvider';
import { leetCodeChannel } from '../leetCodeChannel';
import { leetcodeClient } from '../leetCodeClient';
import { leetnotionManager } from '../leetnotionManager';
import { langExt } from '../shared';
import { handleError } from '../utils/errorUtils';
import { extractCode, getLangFromFile, getNodeIdFromFile } from '../utils/problemUtils';
import { getQuestionNumber } from '../utils/toolUtils';
import { getActiveFilePath } from '../utils/workspaceUtils';
import { leetCodeSubmissionProvider } from '../webview/leetCodeSubmissionProvider';

export async function submitSolution(uri?: vscode.Uri): Promise<void> {
	const filePath: string | undefined = await getActiveFilePath(uri);
	if (!filePath) {
		return;
	}

	try {
		const rawCode = await fse.readFile(filePath, 'utf-8');
		const code = extractCode(rawCode);
		const { slug, lang, questionId } = await extractProblemMeta(filePath, rawCode);

		leetCodeChannel.appendLine(`[Submit] file: ${filePath}`);
		leetCodeChannel.appendLine(`[Submit] slug: ${slug}, lang: ${lang}, questionId: ${questionId}`);
		leetCodeChannel.appendLine(
			`[Submit] rawCode lines: ${rawCode.split('\n').length}, code lines: ${code.split('\n').length}`,
		);
		leetCodeChannel.appendLine(`[Submit] code being sent:\n${code}`);

		if (!slug || !lang || !questionId) {
			vscode.window.showErrorMessage('Could not determine problem metadata from file.');
			return;
		}

		const result = await vscode.window.withProgress(
			{ location: vscode.ProgressLocation.Notification, title: 'Submitting to LeetCode...' },
			() => leetcodeClient.submitCode(slug, lang, questionId, code),
		);

		leetCodeSubmissionProvider.show(result);
		if (result.ok) {
			const questionNumber = getQuestionNumber(filePath);
			if (questionNumber) {
				await leetnotionManager.syncSubmission(questionNumber);
			}
		}
	} catch (error) {
		await handleError(error, 'submit the solution');
		return;
	}

	leetCodeTreeDataProvider.refresh();
}

async function extractProblemMeta(
	filePath: string,
	fileContent: string,
): Promise<{ slug: string | null; lang: string | null; questionId: number | null }> {
	const nodeId = await getNodeIdFromFile(filePath);
	const node = explorerNodeManager.getNodeById(nodeId);
	const slug = node ? node.slug : null;
	const questionId = node ? Number(node.id) : null;

	// Prefer lang from @lc header, fall back to file extension
	let lang: string | null = getLangFromFile(fileContent);
	if (!lang) {
		const ext = path.extname(filePath).slice(1);
		for (const [langName, langExtVal] of langExt.entries()) {
			if (langExtVal === ext) {
				lang = langName;
				break;
			}
		}
	}

	return { slug, lang, questionId };
}
