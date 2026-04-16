import * as vscode from 'vscode';
import { ProblemState } from './shared';
import { globalState } from './globalState';

export interface LeetCodeSession {
	id: string;
	name: string;
	createdAt: number;
}

export interface SessionsMetadata {
	sessions: LeetCodeSession[];
	activeSessionId: string | null;
}

const SessionsMetadataKey = 'leetnotion-sessions-metadata';

function sessionStatusesKey(sessionId: string): string {
	return `leetnotion-session:${sessionId}:statuses`;
}

class SessionManager {
	private _onDidChangeSession = new vscode.EventEmitter<LeetCodeSession | null>();
	public readonly onDidChangeSession = this._onDidChangeSession.event;

	private _statusBarItem: vscode.StatusBarItem;

	constructor() {
		this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
		this._statusBarItem.command = 'leetnotion.switchSession';
	}

	public initialize(): void {
		this.updateStatusBar();
		this._statusBarItem.show();
	}

	public dispose(): void {
		this._onDidChangeSession.dispose();
		this._statusBarItem.dispose();
	}

	private getMetadata(): SessionsMetadata {
		return (globalState.get(SessionsMetadataKey) as SessionsMetadata) ?? {
			sessions: [],
			activeSessionId: null,
		};
	}

	private async setMetadata(metadata: SessionsMetadata): Promise<void> {
		await globalState.update(SessionsMetadataKey, metadata);
	}

	public getActiveSession(): LeetCodeSession | null {
		const metadata = this.getMetadata();
		if (!metadata.activeSessionId) {
			return null;
		}
		return metadata.sessions.find((s) => s.id === metadata.activeSessionId) ?? null;
	}

	public isDefaultSession(): boolean {
		return this.getMetadata().activeSessionId === null;
	}

	public getAllSessions(): LeetCodeSession[] {
		return this.getMetadata().sessions;
	}

	public async createSession(name: string): Promise<LeetCodeSession> {
		const metadata = this.getMetadata();
		const duplicate = metadata.sessions.find(
			(s) => s.name.toLowerCase() === name.toLowerCase(),
		);
		if (duplicate) {
			throw new Error(`Session "${name}" already exists.`);
		}
		const session: LeetCodeSession = {
			id: generateUUID(),
			name,
			createdAt: Date.now(),
		};
		metadata.sessions.push(session);
		metadata.activeSessionId = session.id;
		await this.setMetadata(metadata);
		this.updateStatusBar();
		this._onDidChangeSession.fire(session);
		return session;
	}

	public async switchSession(sessionId: string | null): Promise<void> {
		const metadata = this.getMetadata();
		if (sessionId !== null) {
			const session = metadata.sessions.find((s) => s.id === sessionId);
			if (!session) {
				throw new Error('Session not found.');
			}
		}
		metadata.activeSessionId = sessionId;
		await this.setMetadata(metadata);
		this.updateStatusBar();
		const activeSession = sessionId
			? metadata.sessions.find((s) => s.id === sessionId) ?? null
			: null;
		this._onDidChangeSession.fire(activeSession);
	}

	public async deleteSession(sessionId: string): Promise<void> {
		const metadata = this.getMetadata();
		const index = metadata.sessions.findIndex((s) => s.id === sessionId);
		if (index === -1) {
			throw new Error('Session not found.');
		}
		metadata.sessions.splice(index, 1);
		await globalState.update(sessionStatusesKey(sessionId), undefined);
		const wasActive = metadata.activeSessionId === sessionId;
		if (wasActive) {
			metadata.activeSessionId = null;
		}
		await this.setMetadata(metadata);
		if (wasActive) {
			this.updateStatusBar();
			this._onDidChangeSession.fire(null);
		}
	}

	public getSessionProblemStatuses(): Record<string, ProblemState> {
		const metadata = this.getMetadata();
		if (!metadata.activeSessionId) {
			return {};
		}
		return (
			(globalState.get(sessionStatusesKey(metadata.activeSessionId)) as Record<
				string,
				ProblemState
			>) ?? {}
		);
	}

	public async updateProblemStatus(problemId: string, state: ProblemState): Promise<void> {
		const metadata = this.getMetadata();
		if (!metadata.activeSessionId) {
			return;
		}
		const statuses = this.getSessionProblemStatuses();
		statuses[problemId] = state;
		await globalState.update(sessionStatusesKey(metadata.activeSessionId), statuses);
	}

	public async clearAllSessionData(): Promise<void> {
		const metadata = this.getMetadata();
		for (const session of metadata.sessions) {
			await globalState.update(sessionStatusesKey(session.id), undefined);
		}
		await globalState.update(SessionsMetadataKey, undefined);
		this.updateStatusBar();
	}

	private updateStatusBar(): void {
		const session = this.getActiveSession();
		this._statusBarItem.text = `$(bookmark) ${session ? session.name : 'Default'}`;
		this._statusBarItem.tooltip = 'LeetNotion: Switch Session';
	}
}

function generateUUID(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

export const sessionManager = new SessionManager();
