import * as vscode from 'vscode';
import { IProblem } from './shared';
import {
	Lists,
	Mapping,
	PendingSessionDetails,
	ProblemRatingMap,
	QuestionsOfList,
	TopicTags,
} from './types';

export const CookieKey = 'leetcode-cookie';
export const UserStatusKey = 'leetcode-user-status';
export const TopicTagsKey = 'leetcode-topic-tags';
export const DailyProblemKey = 'leetcode-daily-problem';
export const DailyProblemFetchDateKey = 'leetcode-daily-problem-fetch-date';
export const NotionAccessTokenKey = 'notion-access-token';
export const QuestionsDatabaseIdKey = 'notion-questions-database-id';
export const SubmissionsDatabaseIdKey = 'notion-submissions-database-id';
export const QuestionNumberPageIdMappingKey = 'leetnotion-question-number-page-id-mapping';
export const TitleSlugQuestionNumberMappingKey = 'leetnotion-title-slug-question-number-mapping';
export const NotionIntegrationStatusKey = 'notion-integration-status';
export const UserQuestionTagsKey = 'notion-user-question-tags';
export const PendingSessionKey = 'leetnotion-template-update-pending-session';
export const LeetcodeListsKey = 'leetcode-lists';
export const QuestionsOfListKey = 'leetcode-questions-of-list';
export const ProblemRatingMapKey = 'leetcode-problem-rating-map';
export const ListsSyncTimestampKey = 'leetcode-lists-sync-timestamp';
export const CachedProblemsKey = 'leetcode-cached-problems';

export type UserDataType = {
	isSignedIn: boolean;
	isPremium: boolean;
	username: string;
	avatar: string;
	isVerified?: boolean;
};

export type NotionIntegrationStatus = 'done' | 'pending';

class GlobalState {
	private context: vscode.ExtensionContext;
	private _state: vscode.Memento;
	private _secrets: vscode.SecretStorage;

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
	private _cachedProblems?: IProblem[];

	public async initialize(context: vscode.ExtensionContext): Promise<void> {
		this.context = context;
		this._state = this.context.globalState;
		this._secrets = this.context.secrets;

		// Migrate plaintext secrets from globalState to SecretStorage
		const plaintextCookie = this._state.get<string>(CookieKey);
		if (plaintextCookie) {
			await this._secrets.store(CookieKey, plaintextCookie);
			await this._state.update(CookieKey, undefined);
		}
		const plaintextToken = this._state.get<string>(NotionAccessTokenKey);
		if (plaintextToken) {
			await this._secrets.store(NotionAccessTokenKey, plaintextToken);
			await this._state.update(NotionAccessTokenKey, undefined);
		}

		// Load secrets into in-memory cache for synchronous access
		this._cookie = await this._secrets.get(CookieKey);
		this._notionAccessToken = await this._secrets.get(NotionAccessTokenKey);
	}

	public async setCookie(cookie: string): Promise<void> {
		this._cookie = cookie;
		await this._secrets.store(CookieKey, cookie);
	}

	public getCookie(): string | undefined {
		return this._cookie;
	}

	public setUserStatus(userStatus: UserDataType): any {
		this._userStatus = userStatus;
		return this._state.update(UserStatusKey, userStatus);
	}

	public getUserStatus(): UserDataType | undefined {
		return this._userStatus ?? this._state.get(UserStatusKey);
	}

	public async removeCookie(): Promise<void> {
		this._cookie = undefined;
		await this._secrets.delete(CookieKey);
	}

	public async removeAll(): Promise<void> {
		this._cookie = undefined;
		this._userStatus = undefined;
		await this._secrets.delete(CookieKey);
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
		await this._state.update(DailyProblemFetchDateKey, new Date().toISOString().slice(0, 10));
		return await this._state.update(DailyProblemKey, dailyProblemId);
	}

	public getDailyProblem(): string | undefined {
		return this._dailyProblemId ?? this._state.get(DailyProblemKey);
	}

	public getDailyProblemFetchDate(): string | undefined {
		return this._state.get(DailyProblemFetchDateKey);
	}

	public async setNotionAccessToken(accessToken: string): Promise<void> {
		this._notionAccessToken = accessToken;
		await this._secrets.store(NotionAccessTokenKey, accessToken);
	}

	public getNotionAccessToken(): string | undefined {
		return this._notionAccessToken;
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
		return (
			this._titleSlugQuestionNumberMapping ?? this._state.get(TitleSlugQuestionNumberMappingKey)
		);
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

	public setListsSyncTimestamp(timestamp: number): any {
		return this._state.update(ListsSyncTimestampKey, timestamp);
	}

	public getListsSyncTimestamp(): number | undefined {
		return this._state.get(ListsSyncTimestampKey);
	}

	public getProblemRatingMap() {
		return this._problemRatingMap ?? this._state.get(ProblemRatingMapKey);
	}

	public setProblemRatingMap(problemRatingMap: ProblemRatingMap) {
		this._problemRatingMap = problemRatingMap;
		return this._state.update(ProblemRatingMapKey, problemRatingMap);
	}

	public getCachedProblems(): IProblem[] | undefined {
		return this._cachedProblems ?? this._state.get(CachedProblemsKey);
	}

	public setCachedProblems(problems: IProblem[]) {
		this._cachedProblems = problems;
		return this._state.update(CachedProblemsKey, problems);
	}

	public async getWithBackgroundRefresh<T>(key: string, fetchFn: () => Promise<T>): Promise<any> {
		const cached = this.get(key);
		if (cached) {
			fetchFn()
				.then((fresh) => this.update(key, fresh))
				.catch(() => {});
			return cached;
		} else {
			const fresh = await fetchFn();
			await this.update(key, fresh);
			return fresh;
		}
	}

	public async clearAllExtensionData(): Promise<void> {
		// Clear all in-memory caches
		this._cookie = undefined;
		this._userStatus = undefined;
		this._topicTags = undefined;
		this._dailyProblemId = undefined;
		this._notionAccessToken = undefined;
		this._questionsDatabaseId = undefined;
		this._submissionsDatabaseId = undefined;
		this._questionNumberPageIdMapping = undefined;
		this._titleSlugQuestionNumberMapping = undefined;
		this._notionIntegrationStatus = undefined;
		this._userQuestionTags = undefined;
		this._pendingSession = undefined;
		this._lists = undefined;
		this._questionsOfList = undefined;
		this._problemRatingMap = undefined;
		this._cachedProblems = undefined;

		// Clear secrets
		await this._secrets.delete(CookieKey);
		await this._secrets.delete(NotionAccessTokenKey);

		// Clear all global state keys
		this._state.update(UserStatusKey, undefined);
		this._state.update(TopicTagsKey, undefined);
		this._state.update(DailyProblemKey, undefined);
		this._state.update(QuestionsDatabaseIdKey, undefined);
		this._state.update(SubmissionsDatabaseIdKey, undefined);
		this._state.update(QuestionNumberPageIdMappingKey, undefined);
		this._state.update(TitleSlugQuestionNumberMappingKey, undefined);
		this._state.update(NotionIntegrationStatusKey, undefined);
		this._state.update(UserQuestionTagsKey, undefined);
		this._state.update(PendingSessionKey, undefined);
		this._state.update(LeetcodeListsKey, undefined);
		this._state.update(QuestionsOfListKey, undefined);
		this._state.update(ProblemRatingMapKey, undefined);
		this._state.update(ListsSyncTimestampKey, undefined);
		this._state.update('leetcodeContests', undefined);
		this._state.update('leetcode-favorite-overrides', undefined);
		this._state.update(CachedProblemsKey, undefined);
	}

	public async deleteLeetCodeCache(): Promise<void> {
		// Clear leetcode-specific cached data, preserving Notion state
		this._cookie = undefined;
		this._userStatus = undefined;
		this._lists = undefined;
		this._questionsOfList = undefined;
		this._problemRatingMap = undefined;
		this._cachedProblems = undefined;
		this._topicTags = undefined;
		this._dailyProblemId = undefined;
		await this._secrets.delete(CookieKey);
		this._state.update(UserStatusKey, undefined);
		this._state.update(LeetcodeListsKey, undefined);
		this._state.update(QuestionsOfListKey, undefined);
		this._state.update(ProblemRatingMapKey, undefined);
		this._state.update(CachedProblemsKey, undefined);
		this._state.update(TopicTagsKey, undefined);
		this._state.update(DailyProblemKey, undefined);
		this._state.update(ListsSyncTimestampKey, undefined);
	}

	public get(key: string) {
		return this._state.get(key);
	}

	public async update(key: string, value: any) {
		await this._state.update(key, value);
	}
}

export const globalState: GlobalState = new GlobalState();
