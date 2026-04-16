import * as vscode from 'vscode';
import { sessionManager } from '../sessionManager';

export async function createSession(): Promise<void> {
	const name = await vscode.window.showInputBox({
		prompt: 'Enter a name for the new session',
		placeHolder: 'e.g., DP Practice',
		validateInput: (value) => {
			if (!value || !value.trim()) {
				return 'Session name cannot be empty.';
			}
			const existing = sessionManager.getAllSessions();
			if (existing.some((s) => s.name.toLowerCase() === value.trim().toLowerCase())) {
				return `Session "${value.trim()}" already exists.`;
			}
			return undefined;
		},
	});
	if (!name) {
		return;
	}
	await sessionManager.createSession(name.trim());
	vscode.window.showInformationMessage(`Session "${name.trim()}" created and activated.`);
}

export async function switchSession(): Promise<void> {
	const sessions = sessionManager.getAllSessions();
	const activeSession = sessionManager.getActiveSession();

	interface SessionQuickPickItem extends vscode.QuickPickItem {
		sessionId: string | null;
		action?: 'create' | 'delete';
	}

	const items: SessionQuickPickItem[] = [];

	// Default session option
	items.push({
		label: '$(globe) Default',
		description: activeSession === null ? '(active)' : undefined,
		sessionId: null,
	});

	// Custom sessions
	for (const session of sessions) {
		const isActive = activeSession?.id === session.id;
		items.push({
			label: `$(bookmark) ${session.name}`,
			description: isActive ? '(active)' : undefined,
			sessionId: session.id,
		});
	}

	// Separator + actions
	items.push({
		label: '',
		kind: vscode.QuickPickItemKind.Separator,
		sessionId: null,
	});
	items.push({
		label: '$(add) Create New Session...',
		sessionId: null,
		action: 'create',
	});
	if (sessions.length > 0) {
		items.push({
			label: '$(trash) Delete Session...',
			sessionId: null,
			action: 'delete',
		});
	}

	const picked = await vscode.window.showQuickPick(items, {
		placeHolder: 'Select a session',
	});
	if (!picked) {
		return;
	}

	if (picked.action === 'create') {
		await createSession();
		return;
	}
	if (picked.action === 'delete') {
		await deleteSession();
		return;
	}

	await sessionManager.switchSession(picked.sessionId);
}

export async function deleteSession(): Promise<void> {
	const sessions = sessionManager.getAllSessions();
	if (sessions.length === 0) {
		vscode.window.showInformationMessage('No custom sessions to delete.');
		return;
	}

	const items = sessions.map((s) => ({
		label: s.name,
		description: sessionManager.getActiveSession()?.id === s.id ? '(active)' : undefined,
		sessionId: s.id,
	}));

	const picked = await vscode.window.showQuickPick(items, {
		placeHolder: 'Select a session to delete',
	});
	if (!picked) {
		return;
	}

	const confirm = await vscode.window.showWarningMessage(
		`Are you sure you want to delete session "${picked.label}"? All session data will be lost.`,
		{ modal: true },
		'Delete',
	);
	if (confirm !== 'Delete') {
		return;
	}

	await sessionManager.deleteSession(picked.sessionId);
	vscode.window.showInformationMessage(`Session "${picked.label}" deleted.`);
}
