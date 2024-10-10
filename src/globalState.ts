// Copyright (c) leo.zhao. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { TopicTags } from "./types";

const CookieKey = "leetcode-cookie";
const UserStatusKey = "leetcode-user-status";
const TopicTagsKey = "leetcode-topic-tags";
const DailyProblemKey = "leetcode-daily-problem";

export type UserDataType = {
    isSignedIn: boolean;
    isPremium: boolean;
    username: string;
    avatar: string;
    isVerified?: boolean;
};

class GlobalState {
    private context: vscode.ExtensionContext;
    private _state: vscode.Memento;
    private _cookie: string;
    private _userStatus: UserDataType;

    public initialize(context: vscode.ExtensionContext): void {
        this.context = context;
        this._state = this.context.globalState;
    }

    public setCookie(cookie: string): any {
        this._cookie = cookie;
        return this._state.update(CookieKey, this._cookie);
    }
    public getCookie(): string | undefined {
        return this._cookie ?? this._state.get(CookieKey);
    }

    public setUserStatus(userStatus: UserDataType): any {
        this._userStatus = userStatus;
        return this._state.update(UserStatusKey, this._userStatus);
    }

    public getUserStatus(): UserDataType | undefined {
        return this._userStatus ?? this._state.get(UserStatusKey);
    }

    public removeCookie(): void {
        this._state.update(CookieKey, undefined);
    }

    public removeAll(): void {
        this._state.update(CookieKey, undefined);
        this._state.update(UserStatusKey, undefined);
    }

    public setTopicTags(topicTags: TopicTags): void {
        this._state.update(TopicTagsKey, topicTags);
    }

    public getTopicTags(): TopicTags | undefined {
        return this._state.get(TopicTagsKey);
    }

    public setDailyProblem(dailyProblemId: string): void {
        this._state.update(DailyProblemKey, dailyProblemId);
    }

    public getDailyProblem(): string | undefined {
        return this._state.get(DailyProblemKey);
    }
}

export const globalState: GlobalState = new GlobalState();
