import * as vscode from 'vscode';
import { sessionManager } from '../sessionManager';
import { UserStatus } from '../shared';

export class LeetCodeStatusBarItem implements vscode.Disposable {
	private readonly statusBarItem: vscode.StatusBarItem;

	constructor() {
		this.statusBarItem = vscode.window.createStatusBarItem();
		this.statusBarItem.command = 'leetnotion.switchSession';
	}

	public updateStatusBar(status: UserStatus, user?: string): void {
		switch (status) {
			case UserStatus.SignedIn: {
				const session = sessionManager.getActiveSession();
				this.statusBarItem.text = session
					? `LeetCode: ${user} (${session.name})`
					: `LeetCode: ${user}`;
				break;
			}
			case UserStatus.SignedOut:
			default:
				this.statusBarItem.text = '';
				break;
		}
	}

	public show(): void {
		this.statusBarItem.show();
	}

	public hide(): void {
		this.statusBarItem.hide();
	}

	public dispose(): void {
		this.statusBarItem.dispose();
	}
}
