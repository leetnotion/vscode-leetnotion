import { window } from 'vscode';
import { IS_PROBLEMS_RETRIEVED, LEETCODE_PROBLEMS, UPDATED_PAGES } from '../../constants';
import { globalState } from '../../globalState';
import { leetCodeChannel } from '../../leetCodeChannel';
import { SessionDetails } from '../../types';

const DISK_SESSION_KEYS = new Set([LEETCODE_PROBLEMS, UPDATED_PAGES]);

export class TemplateUpdateSession {
	currentSessionId: string | undefined;
	keys = [IS_PROBLEMS_RETRIEVED, UPDATED_PAGES, LEETCODE_PROBLEMS];

	public async init() {
		const pendingSessionDetails = globalState.getPendingSession();
		if (!pendingSessionDetails) {
			leetCodeChannel.appendLine('There is no pending session. So creating a new session');
			this.currentSessionId = await this.createNewSession();
		} else {
			const option = await window.showQuickPick(['Continue', 'Restart'], {
				title: `You have a discontinued template update session`,
				canPickMany: false,
			});
			if (!option) {
				throw new Error(`Invalid option`);
			}
			if (option === 'Continue') {
				this.currentSessionId = pendingSessionDetails.id;
				leetCodeChannel.appendLine(
					'There is a pending session. The pending session will be continued to update template.',
				);
			} else {
				globalState.setPendingSession(undefined);
				for (const key of this.keys) {
					await this._clear(`${pendingSessionDetails.id}.${key}`);
				}
				this.currentSessionId = await this.createNewSession();
				leetCodeChannel.appendLine('Created a new update session');
			}
		}
	}

	private async createNewSession() {
		const createdTime = new Date();
		const newSessionId = `session-${createdTime.getTime()}`;
		globalState.setPendingSession({
			id: newSessionId,
			createdTime,
		});
		const newSession: SessionDetails = {
			[IS_PROBLEMS_RETRIEVED]: false,
			[LEETCODE_PROBLEMS]: [],
			[UPDATED_PAGES]: {},
		};
		for (const [key, value] of Object.entries(newSession)) {
			await this._set(`${newSessionId}.${key}`, value);
		}
		leetCodeChannel.appendLine(`Created new session with session ID: ${newSessionId}`);
		return newSessionId;
	}

	async get(property: string) {
		if (!this.currentSessionId) {
			throw new Error(`Session not initialized`);
		}
		const fullKey = `${this.currentSessionId}.${property}`;
		if (DISK_SESSION_KEYS.has(property)) {
			return globalState.getDisk(fullKey);
		}
		return globalState.get(fullKey);
	}

	async update(property: string, value: unknown) {
		if (!this.currentSessionId) return;
		await this._set(`${this.currentSessionId}.${property}`, value);
	}

	async append(property: string, value: unknown) {
		if (!this.currentSessionId) {
			throw new Error(`Session not initialized`);
		}
		let arr = await this.get(property) as unknown[];
		if (!arr) {
			arr = [];
		}
		arr.push(value);
		await this._set(`${this.currentSessionId}.${property}`, value === undefined ? undefined : arr);
	}

	async close() {
		globalState.setPendingSession(undefined);
		for (const key of this.keys) {
			await this.update(key, undefined);
		}
	}

	private async _set(fullKey: string, value: unknown) {
		const property = fullKey.split('.').pop()!;
		if (DISK_SESSION_KEYS.has(property)) {
			await globalState.updateDisk(fullKey, value);
		} else {
			await globalState.update(fullKey, value);
		}
	}

	private async _clear(fullKey: string) {
		const property = fullKey.split('.').pop()!;
		if (DISK_SESSION_KEYS.has(property)) {
			await globalState.updateDisk(fullKey, undefined);
		} else {
			await globalState.update(fullKey, undefined);
		}
	}
}

export const templateUpdateSession: TemplateUpdateSession = new TemplateUpdateSession();
