// Copyright (c) leetnotion. All rights reserved.
// Licensed under the MIT license.

import LeetCode, { Credential, LeetCodeAdvanced } from "@leetnotion/leetcode-api";
import { globalState } from "./globalState";
import * as vscode from "vscode";
import { extractCookie } from "./utils/toolUtils";
import { DialogType, promptForOpenOutputChannel } from "./utils/uiUtils";
import { leetCodeChannel } from "./leetCodeChannel";



class LeetcodeClient {
    private context: vscode.ExtensionContext;
    private leetcode: LeetCodeAdvanced;
    private isSignedIn: boolean;

    public initialize(context: vscode.ExtensionContext) {
        this.context = context;
        const cookie = globalState.getCookie();
        if (cookie) {
            this.isSignedIn = true;
            const credential = new Credential(extractCookie(cookie));
            this.leetcode = new LeetCodeAdvanced(credential);
        } else {
            this.isSignedIn = false;
            this.leetcode = new LeetCodeAdvanced();
        }
    }

    public signOut() {
        this.isSignedIn = false;
        this.leetcode = new LeetCodeAdvanced();
    }

    public async getTopicTags() {
        return await this.leetcode.topicTags();
    }

    public async collectEasterEgg() {
        if (!this.isSignedIn) return;
        try {
            const isCollected = await this.leetcode.collectEasterEgg();
            if (isCollected) {
                promptForOpenOutputChannel(`Collected Easter Egg 🎉: +10 coins`, DialogType.info);
            }
        } catch (error) {
            leetCodeChannel.appendLine(`Error collecting Easter Egg: ${error}`);
        }
    }

    public async checkIn() {
        if (!this.isSignedIn) return;
        try {
            const checkedIn = await this.leetcode.checkIn();
            if (checkedIn) {
                promptForOpenOutputChannel(`Checked in: +1 Coin`, DialogType.info);
            }
        } catch (error) {
            leetCodeChannel.appendLine(`Error checking in: ${error}`);
        }
    }

    public async setDailyProblem() {
        try {
            const { question: { questionFrontendId } } = await this.leetcode.daily();
            globalState.setDailyProblem(questionFrontendId);
        } catch (error) {
            leetCodeChannel.appendLine(`Error getting daily question: ${error}`);
        }
    }
}

export const leetcodeClient: LeetcodeClient = new LeetcodeClient();
