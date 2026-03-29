// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as fse from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { explorerNodeManager } from '../explorer/explorerNodeManager';
import { leetCodeChannel } from '../leetCodeChannel';
import { leetcodeClient } from '../leetCodeClient';
import { leetCodeManager } from '../leetCodeManager';
import { IQuickItemEx, langExt, UserStatus } from '../shared';
import { extractCode, getLangFromFile, getNodeIdFromFile } from '../utils/problemUtils';
import { DialogType, promptForOpenOutputChannel, showFileSelectDialog } from '../utils/uiUtils';
import { getActiveFilePath } from '../utils/workspaceUtils';
import { leetCodeSubmissionProvider } from '../webview/leetCodeSubmissionProvider';
import { leetCodeTestCaseProvider } from '../webview/leetCodeTestCaseProvider';

export async function testSolution(uri?: vscode.Uri): Promise<void> {
	try {
		if (leetCodeManager.getStatus() === UserStatus.SignedOut) {
			return;
		}

		const filePath: string | undefined = await getActiveFilePath(uri);
		if (!filePath) {
			return;
		}
		const picks: Array<IQuickItemEx<string>> = [];
		picks.push(
			{
				label: '$(three-bars) Default test cases',
				description: '',
				detail: 'Test with the default cases',
				value: ':default',
			},
			{
				label: '$(edit) Open test case editor...',
				description: '',
				detail: 'Edit test cases in a webview panel',
				value: ':direct',
			},
			{
				label: '$(file-text) Browse...',
				description: '',
				detail: 'Test with the written cases in file',
				value: ':file',
			},
		);
		const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(picks);
		if (!choice) {
			return;
		}

		const rawCode = await fse.readFile(filePath, 'utf-8');
		const code = extractCode(rawCode);
		const { slug, lang, questionId, sampleTestCase } = await extractTestMeta(filePath, rawCode);

		leetCodeChannel.appendLine(`[Test] file: ${filePath}`);
		leetCodeChannel.appendLine(`[Test] slug: ${slug}, lang: ${lang}, questionId: ${questionId}`);
		leetCodeChannel.appendLine(
			`[Test] rawCode lines: ${rawCode.split('\n').length}, code lines: ${code.split('\n').length}`,
		);
		leetCodeChannel.appendLine(`[Test] code being sent:\n${code}`);

		if (!slug || !lang || questionId === null) {
			vscode.window.showErrorMessage('Could not determine problem metadata from file.');
			return;
		}

		let dataInput: string = sampleTestCase;
		switch (choice.value) {
			case ':default':
				break;
			case ':direct': {
				const node = explorerNodeManager.getNodeById(
					await getNodeIdFromFile(filePath),
				);
				if (!node) {
					vscode.window.showErrorMessage('Could not find problem node.');
					return;
				}
				leetCodeTestCaseProvider.show(node, sampleTestCase);
				return;
			}
			case ':file': {
				const testFile: vscode.Uri[] | undefined = await showFileSelectDialog(filePath);
				if (testFile && testFile.length) {
					const input: string = (await fse.readFile(testFile[0].fsPath, 'utf-8')).trim();
					if (input) {
						dataInput = input;
					} else {
						vscode.window.showErrorMessage('The selected test file must not be empty.');
						return;
					}
				} else {
					return;
				}
				break;
			}
			default:
				return;
		}

		const results = await vscode.window.withProgress(
			{ location: vscode.ProgressLocation.Notification, title: 'Testing solution...' },
			() => leetcodeClient.testCode(slug, lang, questionId, code, dataInput),
		);

		if (!results || results.length === 0) {
			return;
		}
		leetCodeSubmissionProvider.show(results[0], true, dataInput);
	} catch (error) {
		await promptForOpenOutputChannel(
			'Failed to test the solution. Please open the output channel for details.',
			DialogType.error,
		);
	}
}

async function extractTestMeta(
	filePath: string,
	fileContent: string,
): Promise<{
	slug: string | null;
	lang: string | null;
	questionId: number | null;
	sampleTestCase: string;
}> {
	const nodeId = await getNodeIdFromFile(filePath);
	const node = explorerNodeManager.getNodeById(nodeId);
	const slug = node ? node.slug : null;
	const questionId = node ? Number(node.id) : null;

	let sampleTestCase = '';
	if (slug) {
		try {
			const problem = await leetcodeClient.leetcode.problem(slug);
			sampleTestCase = problem.exampleTestcases || problem.sampleTestCase || '';
		} catch {
			// Fall through with empty test case
		}
	}

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

	return { slug, lang, questionId, sampleTestCase };
}
