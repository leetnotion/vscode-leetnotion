import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { IS_PROBLEMS_RETRIEVED, LEETCODE_PROBLEMS, UPDATED_PAGES } from './constants';
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

const DISK_STORAGE_KEYS = new Set([
	TopicTagsKey,
	QuestionNumberPageIdMappingKey,
	TitleSlugQuestionNumberMappingKey,
	QuestionsOfListKey,
	ProblemRatingMapKey,
	CachedProblemsKey,
	'leetcodeContests',
]);

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
	private _cacheDirPath: string;

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

	private async _ensureCacheDir(): Promise<void> {
		await fs.mkdir(this._cacheDirPath, { recursive: true });
	}

	private _diskPath(key: string): string {
		return path.join(this._cacheDirPath, `${key}.json`);
	}

	private async _readFromDisk<T>(key: string): Promise<T | undefined> {
		try {
			const data = await fs.readFile(this._diskPath(key), 'utf-8');
			return JSON.parse(data) as T;
		} catch {
			return undefined;
		}
	}

	private async _writeToDisk<T>(key: string, value: T | undefined): Promise<void> {
		if (value === undefined) {
			await fs.unlink(this._diskPath(key)).catch(() => {});
			return;
		}
		await this._ensureCacheDir();
		await fs.writeFile(this._diskPath(key), JSON.stringify(value));
	}

	public async initialize(context: vscode.ExtensionContext): Promise<void> {
		this.context = context;
		this._state = this.context.globalState;
		this._secrets = this.context.secrets;
		this._cacheDirPath = path.join(this.context.globalStorageUri.fsPath, 'cache');
		await this._migrateToDisk();

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

		// Load disk-cached data into memory for synchronous access
		this._topicTags = await this._readFromDisk<TopicTags>(TopicTagsKey);
		this._questionNumberPageIdMapping = await this._readFromDisk<Mapping>(QuestionNumberPageIdMappingKey);
		this._titleSlugQuestionNumberMapping = await this._readFromDisk<Mapping>(TitleSlugQuestionNumberMappingKey);
		this._problemRatingMap = await this._readFromDisk<ProblemRatingMap>(ProblemRatingMapKey);
		this._cachedProblems = await this._readFromDisk<IProblem[]>(CachedProblemsKey);
	}

	private async _migrateToDisk(): Promise<void> {
		for (const key of DISK_STORAGE_KEYS) {
			const data = this._state.get(key);
			if (data !== undefined) {
				await this._writeToDisk(key, data);
				await this._state.update(key, undefined);
			}
		}

		// Migrate pending session's large keys from globalState to disk
		const pendingSession = this._state.get<PendingSessionDetails>(PendingSessionKey);
		if (pendingSession) {
			for (const key of [UPDATED_PAGES, LEETCODE_PROBLEMS]) {
				const sessionKey = `${pendingSession.id}.${key}`;
				const data = this._state.get(sessionKey);
				if (data !== undefined) {
					await this._writeToDisk(sessionKey, data);
					await this._state.update(sessionKey, undefined);
				}
			}
		}
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

	public async setTopicTags(topicTags: TopicTags): Promise<void> {
		this._topicTags = topicTags;
		await this._writeToDisk(TopicTagsKey, topicTags);
	}

	public getTopicTags(): TopicTags | undefined {
		return this._topicTags;
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

	public async setQuestionNumberPageIdMapping(mapping: Mapping): Promise<void> {
		this._questionNumberPageIdMapping = mapping;
		await this._writeToDisk(QuestionNumberPageIdMappingKey, mapping);
	}

	public getQuestionNumberPageIdMapping(): Mapping | undefined {
		return this._questionNumberPageIdMapping;
	}

	public async setTitleSlugQuestionNumberMapping(mapping: Mapping): Promise<void> {
		this._titleSlugQuestionNumberMapping = mapping;
		await this._writeToDisk(TitleSlugQuestionNumberMappingKey, mapping);
	}

	public getTitleSlugQuestionNumberMapping(): Mapping | undefined {
		return this._titleSlugQuestionNumberMapping;
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
			await this._initializeQuestionsOfList();
		}
		this._questionsOfList![listId] = questions;
		await this._writeToDisk(QuestionsOfListKey, this._questionsOfList);
	}

	public async getQuestionsOfList(listId: string): Promise<QuestionsOfList | undefined> {
		if (!this._questionsOfList) {
			await this._initializeQuestionsOfList();
		}
		return this._questionsOfList![listId] ?? [];
	}

	private async _initializeQuestionsOfList(): Promise<void> {
		const savedState = await this._readFromDisk<Record<string, QuestionsOfList>>(QuestionsOfListKey) || {};
		this._questionsOfList = { ...savedState };
	}

	public setListsSyncTimestamp(timestamp: number): any {
		return this._state.update(ListsSyncTimestampKey, timestamp);
	}

	public getListsSyncTimestamp(): number | undefined {
		return this._state.get(ListsSyncTimestampKey);
	}

	public getProblemRatingMap(): ProblemRatingMap | undefined {
		return this._problemRatingMap;
	}

	public async setProblemRatingMap(problemRatingMap: ProblemRatingMap): Promise<void> {
		this._problemRatingMap = problemRatingMap;
		await this._writeToDisk(ProblemRatingMapKey, problemRatingMap);
	}

	public getCachedProblems(): IProblem[] | undefined {
		return this._cachedProblems;
	}

	public async setCachedProblems(problems: IProblem[]): Promise<void> {
		this._cachedProblems = problems;
		await this._writeToDisk(CachedProblemsKey, problems);
	}

	public async getWithBackgroundRefresh<T>(key: string, fetchFn: () => Promise<T>): Promise<any> {
		const isDiskKey = DISK_STORAGE_KEYS.has(key);
		const cached = isDiskKey ? await this._readFromDisk<T>(key) : this.get(key);
		if (cached) {
			fetchFn()
				.then(async (fresh) => {
					if (isDiskKey) {
						await this._writeToDisk(key, fresh);
					} else {
						await this.update(key, fresh);
					}
				})
				.catch(() => {});
			return cached;
		} else {
			const fresh = await fetchFn();
			if (isDiskKey) {
				await this._writeToDisk(key, fresh);
			} else {
				await this.update(key, fresh);
			}
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
		this._state.update(DailyProblemKey, undefined);
		this._state.update(DailyProblemFetchDateKey, undefined);
		this._state.update(QuestionsDatabaseIdKey, undefined);
		this._state.update(SubmissionsDatabaseIdKey, undefined);
		this._state.update(NotionIntegrationStatusKey, undefined);
		this._state.update(UserQuestionTagsKey, undefined);
		// Clean up dynamic session keys if a pending session exists
		const pendingSession = this.getPendingSession();
		if (pendingSession) {
			this._state.update(`${pendingSession.id}.${IS_PROBLEMS_RETRIEVED}`, undefined);
			await this._writeToDisk(`${pendingSession.id}.${UPDATED_PAGES}`, undefined);
			await this._writeToDisk(`${pendingSession.id}.${LEETCODE_PROBLEMS}`, undefined);
		}
		this._state.update(PendingSessionKey, undefined);
		this._state.update(LeetcodeListsKey, undefined);
		this._state.update(ListsSyncTimestampKey, undefined);
		this._state.update('leetcode-favorite-overrides', undefined);
		// Clear disk-stored data
		for (const key of DISK_STORAGE_KEYS) {
			await this._writeToDisk(key, undefined);
		}
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
		this._state.update(DailyProblemKey, undefined);
		this._state.update(ListsSyncTimestampKey, undefined);
		const leetcodeDiskKeys = [QuestionsOfListKey, ProblemRatingMapKey, CachedProblemsKey, TopicTagsKey];
		for (const key of leetcodeDiskKeys) {
			await this._writeToDisk(key, undefined);
		}
	}

	public get(key: string) {
		return this._state.get(key);
	}

	public async update(key: string, value: any) {
		await this._state.update(key, value);
	}

	public async getDisk<T>(key: string): Promise<T | undefined> {
		return this._readFromDisk<T>(key);
	}

	public async updateDisk<T>(key: string, value: T | undefined): Promise<void> {
		await this._writeToDisk(key, value);
	}
}

export const globalState: GlobalState = new GlobalState();
