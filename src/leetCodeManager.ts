// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { EventEmitter } from 'events';
import * as vscode from 'vscode';
import { getLeetCodeEndpoint } from './commands/plugin';
import { globalState } from './globalState';
import { leetcodeClient } from './leetCodeClient';
import { leetnotionManager } from './leetnotionManager';
import { queryUserData } from './request/query-user-data';
import { Endpoint, urls, urlsCn, UserStatus } from './shared';
import { hasNotionIntegrationEnabled } from './utils/settingUtils';
import { parseQuery } from './utils/toolUtils';
import { DialogType, openUrl, promptForOpenOutputChannel } from './utils/uiUtils';

class LeetCodeManager extends EventEmitter {
	private currentUser: string | undefined;
	private userStatus: UserStatus;

	constructor() {
		super();
		this.currentUser = undefined;
		this.userStatus = UserStatus.SignedOut;
		this.handleUriSignIn = this.handleUriSignIn.bind(this);
	}

	public async getLoginStatus(): Promise<void> {
		try {
			const cookie = globalState.getCookie();
			if (!cookie) {
				throw new Error('No cookie found');
			}
			leetcodeClient.initialize();
			const userInfo = await leetcodeClient.getUserInfo();
			if (userInfo) {
				this.currentUser = userInfo.username;
				this.userStatus = UserStatus.SignedIn;
			} else {
				throw new Error('Failed to get user info');
			}
		} catch (error) {
			this.currentUser = undefined;
			this.userStatus = UserStatus.SignedOut;
			await globalState.removeAll();
			leetcodeClient.signOut();
		} finally {
			this.emit('statusChanged');
		}
	}

	private async updateUserStatusWithCookie(cookie: string): Promise<void> {
		await globalState.setCookie(cookie);
		const data = await queryUserData();
		globalState.setUserStatus(data);
		leetcodeClient.initialize();
		if (data.username) {
			vscode.window.showInformationMessage(`Successfully logged in to leetcode: ${data.username}.`);
			this.currentUser = data.username;
			this.userStatus = UserStatus.SignedIn;
			this.emit('statusChanged');
		}
		if (hasNotionIntegrationEnabled()) {
			leetnotionManager.enableNotionIntegration();
		}
	}

	public async handleUriSignIn(uri: vscode.Uri): Promise<void> {
		try {
			await vscode.window.withProgress(
				{ location: vscode.ProgressLocation.Notification },
				async (progress: vscode.Progress<{}>) => {
					progress.report({ message: 'Fetching user data...' });
					const queryParams = parseQuery(uri.query);
					const cookie = queryParams['cookie'];
					if (!cookie) {
						promptForOpenOutputChannel(
							`Failed to get cookie. Please log in again`,
							DialogType.error,
						);
						return;
					}
					await this.updateUserStatusWithCookie(cookie);
				},
			);
		} catch (error) {
			promptForOpenOutputChannel(
				`Failed to log in. Please open the output channel for details`,
				DialogType.error,
			);
		}
	}

	public async handleInputCookieSignIn(): Promise<void> {
		const cookie: string | undefined = await vscode.window.showInputBox({
			prompt: 'Enter LeetCode Cookie',
			password: true,
			ignoreFocusOut: true,
			validateInput: (s: string): string | undefined =>
				s ? undefined : 'Cookie must not be empty',
		});
		if (!cookie) {
			return;
		}
		await this.updateUserStatusWithCookie(cookie);
	}

	public async signIn(): Promise<void> {
		const picks: Array<{ label: string; detail: string; value: string; description?: string }> = [];
		picks.push(
			{
				label: 'Web Authorization',
				detail: 'Open browser to authorize login on the website',
				value: 'WebAuth',
				description: '[Recommended]',
			},
			{
				label: 'LeetCode Cookie',
				detail: 'Use LeetCode cookie copied from browser to login',
				value: 'Cookie',
			},
		);

		const choice = await vscode.window.showQuickPick(picks);
		if (!choice) {
			return;
		}

		if (choice.value === 'WebAuth') {
			openUrl(this.getAuthLoginUrl());
			return;
		}

		try {
			await vscode.window.withProgress(
				{ location: vscode.ProgressLocation.Notification, title: 'Fetching user data...' },
				async () => {
					await this.handleInputCookieSignIn();
				},
			);
		} catch (error) {
			promptForOpenOutputChannel(
				`Failed to log in. Please open the output channel for details`,
				DialogType.error,
			);
		}
	}

	public async signOut(): Promise<void> {
		try {
			vscode.window.showInformationMessage('Successfully signed out.');
			this.currentUser = undefined;
			this.userStatus = UserStatus.SignedOut;
			await globalState.removeAll();
			leetcodeClient.signOut();
			this.emit('statusChanged');
		} catch (error) {
			// swallow the error when sign out.
		}
	}

	public getStatus(): UserStatus {
		return this.userStatus;
	}

	public getUser(): string | undefined {
		return this.currentUser;
	}

	public getAuthLoginUrl(): string {
		switch (getLeetCodeEndpoint()) {
			case Endpoint.LeetCodeCN:
				return urlsCn.authLoginUrl;
			case Endpoint.LeetCode:
			default:
				return urls.authLoginUrl;
		}
	}
}

export const leetCodeManager: LeetCodeManager = new LeetCodeManager();
