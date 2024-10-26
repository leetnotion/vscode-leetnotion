// Copyright (c) leetnotion. All rights reserved.
// Licensed under the MIT license.

import { Credential, LeetCodeAdvanced } from "@leetnotion/leetcode-api";
import { globalState } from "./globalState";
import { extractCookie } from "./utils/toolUtils";
import { DialogType, promptForOpenOutputChannel } from "./utils/uiUtils";
import { leetCodeChannel } from "./leetCodeChannel";
import { LeetcodeProblem } from "./types";

class LeetcodeClient {
    private leetcode: LeetCodeAdvanced;
    private isSignedIn: boolean;

    public initialize() {
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

    public async setTitleSlugQuestionNumberMapping() {
        const mapping = await this.leetcode.getTitleSlugQuestionNumberMapping();
        globalState.setTitleSlugQuestionNumberMapping(mapping);
    }

    public async collectEasterEgg() {
        if (!this.isSignedIn) return;
        try {
            const isCollected = await this.leetcode.collectEasterEgg();
            if (isCollected) {
                promptForOpenOutputChannel(`Collected Easter Egg 🎉: +10 coins`, DialogType.completed);
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
                promptForOpenOutputChannel(`Checked in: +1 Coin`, DialogType.completed);
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

    public async getNoOfProblems() {
        return await this.leetcode.noOfProblems();
    }

    public async getRecentSubmission() {
        if (!this.isSignedIn) {
            leetCodeChannel.appendLine('Leetcode user not signed in');
            return null;
        }
        return await this.leetcode.recentSubmission();
    }

    public async getLeetcodeProblems(progressCallback: (problems: LeetcodeProblem[]) => void = () => { }): Promise<LeetcodeProblem[]> {
        try {
            if (!this.isSignedIn) throw new Error(`not-signed-in-to-leetcode`);
            const problems = await this.leetcode.getLeetcodeProblems(500, progressCallback);
            const problemTypes = await this.leetcode.getProblemTypes();
            const typedProblems = problems.map(problem => ({
                ...problem,
                type: problemTypes[problem.questionFrontendId]
            }))
            return typedProblems;
        } catch (error) {
            throw new Error(`Error getting leetcode problems: ${error}`);
        }
    }

    public async getUserSubmissions() {
    }
}

export const leetcodeClient: LeetcodeClient = new LeetcodeClient();
