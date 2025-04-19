import * as vscode from "vscode";
import { Lists, Mapping, PendingSessionDetails, ProblemRatingMap, QuestionsOfList, TopicTags } from "./types";

export const CookieKey = "leetcode-cookie";
export const UserStatusKey = "leetcode-user-status";
export const TopicTagsKey = "leetcode-topic-tags";
export const DailyProblemKey = "leetcode-daily-problem";
export const NotionAccessTokenKey = "notion-access-token";
export const QuestionsDatabaseIdKey = "notion-questions-database-id";
export const SubmissionsDatabaseIdKey = "notion-submissions-database-id";
export const QuestionNumberPageIdMappingKey = "leetnotion-question-number-page-id-mapping";
export const TitleSlugQuestionNumberMappingKey = "leetnotion-title-slug-question-number-mapping";
export const NotionIntegrationStatusKey = "notion-integration-status";
export const UserQuestionTagsKey = "notion-user-question-tags";
export const PendingSessionKey = "leetnotion-template-update-pending-session";
export const LeetcodeListsKey = "leetcode-lists";
export const QuestionsOfListKey = "leetcode-questions-of-list";
export const ProblemRatingMapKey = "leetcode-problem-rating-map";

export type UserDataType = {
    isSignedIn: boolean;
    isPremium: boolean;
    username: string;
    avatar: string;
    isVerified?: boolean;
};

export type NotionIntegrationStatus = "done" | "pending";

class GlobalState {
    private context: vscode.ExtensionContext;
    private _state: vscode.Memento;

    private _cookie?: string;
    private _userStatus?: UserDataType;

    private _topicTags?: TopicTags;
    private _dailyProblemId?: string;
    private _notionAccessToken?: string;
    private _questionsDatabaseId?: string;
    private _submissionsDatabaseId?: string;
    private _questionNumberPageIdMapping?: Mapping;
    private _titleSlugQuestionNumberMapping?: Mapping;
    private _notionIntegrationStatus?: NotionIntegrationStatus;
    private _userQuestionTags?: string[];
    private _pendingSession?: PendingSessionDetails;
    private _lists?: Lists;
    private _questionsOfList?: Record<string, QuestionsOfList>;
    private _problemRatingMap?: ProblemRatingMap;

    public initialize(context: vscode.ExtensionContext): void {
        this.context = context;
        this._state = this.context.globalState;
    }

    public setCookie(cookie: string): any {
        this._cookie = cookie;
        return this._state.update(CookieKey, cookie);
    }

    public getCookie(): string | undefined {
        return this._cookie ?? this._state.get(CookieKey);
    }

    public setUserStatus(userStatus: UserDataType): any {
        this._userStatus = userStatus;
        return this._state.update(UserStatusKey, userStatus);
    }

    public getUserStatus(): UserDataType | undefined {
        return this._userStatus ?? this._state.get(UserStatusKey);
    }

    public removeCookie(): void {
        this._cookie = undefined;
        this._state.update(CookieKey, undefined);
    }

    public removeAll(): void {
        this._cookie = undefined;
        this._userStatus = undefined;
        this._state.update(CookieKey, undefined);
        this._state.update(UserStatusKey, undefined);
    }

    public setTopicTags(topicTags: TopicTags): any {
        this._topicTags = topicTags;
        return this._state.update(TopicTagsKey, topicTags);
    }

    public getTopicTags(): TopicTags | undefined {
        return this._topicTags ?? this._state.get(TopicTagsKey);
    }

    public async setDailyProblem(dailyProblemId: string): Promise<any> {
        this._dailyProblemId = dailyProblemId;
        return await this._state.update(DailyProblemKey, dailyProblemId);
    }

    public getDailyProblem(): string | undefined {
        return this._dailyProblemId ?? this._state.get(DailyProblemKey);
    }

    public async setNotionAccessToken(accessToken: string): Promise<any> {
        this._notionAccessToken = accessToken;
        return await this._state.update(NotionAccessTokenKey, accessToken);
    }

    public getNotionAccessToken(): string | undefined {
        return this._notionAccessToken ?? this._state.get(NotionAccessTokenKey);
    }

    public setQuestionsDatabaseId(id: string): any {
        this._questionsDatabaseId = id;
        return this._state.update(QuestionsDatabaseIdKey, id);
    }

    public getQuestionsDatabaseId(): string | undefined {
        return this._questionsDatabaseId ?? this._state.get(QuestionsDatabaseIdKey);
    }

    public setSubmissionsDatabaseId(id: string): any {
        this._submissionsDatabaseId = id;
        return this._state.update(SubmissionsDatabaseIdKey, id);
    }

    public getSubmissionsDatabaseId(): string | undefined {
        return this._submissionsDatabaseId ?? this._state.get(SubmissionsDatabaseIdKey);
    }

    public setQuestionNumberPageIdMapping(mapping: Mapping): any {
        this._questionNumberPageIdMapping = mapping;
        return this._state.update(QuestionNumberPageIdMappingKey, mapping);
    }

    public getQuestionNumberPageIdMapping(): Mapping | undefined {
        return this._questionNumberPageIdMapping ?? this._state.get(QuestionNumberPageIdMappingKey);
    }

    public setTitleSlugQuestionNumberMapping(mapping: Mapping): any {
        this._titleSlugQuestionNumberMapping = mapping;
        return this._state.update(TitleSlugQuestionNumberMappingKey, mapping);
    }

    public getTitleSlugQuestionNumberMapping(): Mapping | undefined {
        return this._titleSlugQuestionNumberMapping ?? this._state.get(TitleSlugQuestionNumberMappingKey);
    }

    public setNotionIntegrationStatus(status: NotionIntegrationStatus): any {
        this._notionIntegrationStatus = status;
        return this._state.update(NotionIntegrationStatusKey, status);
    }

    public getNotionIntegrationStatus(): NotionIntegrationStatus | undefined {
        return this._notionIntegrationStatus ?? this._state.get(NotionIntegrationStatusKey);
    }

    public getExtensionUri(): vscode.Uri {
        return this.context.extensionUri;
    }

    public setUserQuestionTags(tags: string[]): any {
        this._userQuestionTags = tags;
        return this._state.update(UserQuestionTagsKey, tags);
    }

    public getUserQuestionTags(): string[] | undefined {
        return this._userQuestionTags ?? this._state.get(UserQuestionTagsKey);
    }

    public setPendingSession(pendingSession: PendingSessionDetails | undefined): any {
        this._pendingSession = pendingSession;
        return this._state.update(PendingSessionKey, pendingSession);
    }

    public getPendingSession(): PendingSessionDetails | undefined {
        return this._pendingSession ?? this._state.get(PendingSessionKey);
    }

    public setLists(lists: Lists | undefined): any {
        this._lists = lists;
        return this._state.update(LeetcodeListsKey, lists);
    }

    public getLists(): Lists | undefined {
        return this._lists ?? this._state.get(LeetcodeListsKey);
    }

    public async setQuestionsOfList(questions: QuestionsOfList, listId: string): Promise<void> {
        if (!this._questionsOfList) {
            this._initializeQuestionsOfList();
        }
        this._questionsOfList[listId] = questions;
        await this._state.update(QuestionsOfListKey, this._questionsOfList);
    }

    public async getQuestionsOfList(listId: string): Promise<QuestionsOfList | undefined> {
        if (!this._questionsOfList) {
            await this._initializeQuestionsOfList();
        }
        return this._questionsOfList[listId] ?? [];
    }

    private async _initializeQuestionsOfList(): Promise<void> {
        const savedState = this._state.get<Record<string, QuestionsOfList>>(QuestionsOfListKey) || {};
        this._questionsOfList = { ...savedState };
    }

    public getProblemRatingMap() {
        return this._problemRatingMap ?? this._state.get(ProblemRatingMapKey);
    }

    public setProblemRatingMap(problemRatingMap: ProblemRatingMap) {
        this._problemRatingMap = problemRatingMap;
        return this._state.update(ProblemRatingMapKey, problemRatingMap);
    }

    public clearAllNotionDetails(): void {
        this._topicTags = undefined;
        this._dailyProblemId = undefined;
        this._notionAccessToken = undefined;
        this._questionsDatabaseId = undefined;
        this._submissionsDatabaseId = undefined;
        this._questionNumberPageIdMapping = undefined;
        this._notionIntegrationStatus = undefined
        this._userQuestionTags = undefined;
        this._pendingSession = undefined;
        this._state.update(TopicTagsKey, undefined);
        this._state.update(DailyProblemKey, undefined);
        this._state.update(NotionAccessTokenKey, undefined);
        this._state.update(QuestionsDatabaseIdKey, undefined);
        this._state.update(SubmissionsDatabaseIdKey, undefined);
        this._state.update(QuestionNumberPageIdMappingKey, undefined);
        this._state.update(NotionIntegrationStatusKey, undefined);
        this._state.update(UserQuestionTagsKey, undefined);
        this._state.update(PendingSessionKey, undefined);
        this._state.update(LeetcodeListsKey, undefined);
        this._state.update(QuestionsOfListKey, undefined);
        this._state.update(ProblemRatingMapKey, undefined);
    }

    public get(key: string) {
        return this._state.get(key);
    }

    public async update(key: string, value: any) {
        await this._state.update(key, value);
    }
}

export const globalState: GlobalState = new GlobalState();
