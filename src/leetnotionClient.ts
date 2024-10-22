import AdvancedNotionClient, { PageObjectResponse } from "@leetnotion/notion-api";
import { globalState } from "./globalState";
import { Mapping, ProblemPageResponse, QueryProblemPageProperties } from "./types";
import { leetCodeChannel } from "./leetCodeChannel";
import { hasNotionIntegrationEnabled, shouldAddCodeToSubmissionPage } from "./utils/settingUtils";
import { leetcodeClient } from "./leetCodeClient";
import * as _ from 'lodash'
import { DialogType, promptForOpenOutputChannel } from "./utils/uiUtils";
import { getISODate, getNotionLang, splitTextIntoChunks } from "./utils/toolUtils";
import { Submission } from "@leetnotion/leetcode-api";

const QuestionsDatabaseKey = "Questions Database";
const SubmissionsDatabaseKey = "Submissions Database";

class LeetnotionClient {
    private notion: AdvancedNotionClient | undefined;
    private isSignedIn: boolean;

    public initialize() {
        const accessToken = globalState.getNotionAccessToken();
        if (accessToken) {
            this.isSignedIn = true;
            this.notion = new AdvancedNotionClient(accessToken);
        } else {
            this.isSignedIn = false;
            this.notion = undefined;
        }
    }

    public signOut() {
        this.isSignedIn = false;
        this.notion = undefined;
    }

    public async isValidAccessToken(accessToken: string): Promise<boolean> {
        const localClient = new AdvancedNotionClient(accessToken);
        const questionsDatabaseId = await localClient.getDatabaseId(QuestionsDatabaseKey);
        if (questionsDatabaseId === null) return false;
        return true;
    }

    public async setDatabaseIds() {
        if (!this.isSignedIn) return;
        const questionsDatabaseId = await this.notion?.getDatabaseId(QuestionsDatabaseKey);
        if (!questionsDatabaseId) {
            leetCodeChannel.appendLine(`Invalid notion questions database id`);
            return;
        }
        globalState.setQuestionsDatabaseId(questionsDatabaseId);
        const submissionsDatabaseId = await this.notion?.getDatabaseId(SubmissionsDatabaseKey);
        if (!submissionsDatabaseId) {
            leetCodeChannel.appendLine(`Invalid notion submissions database id`);
            return;
        }
        globalState.setSubmissionsDatabaseId(submissionsDatabaseId);
    }

    public async updateTemplateInformation(callbackFn: () => void = () => { }) {
        if (!this.isSignedIn) return;
        const questionsDatabaseId = globalState.getQuestionsDatabaseId();
        if (!questionsDatabaseId) return;
        let pages: ProblemPageResponse[] = await this.notion?.getAllPages(questionsDatabaseId as string, callbackFn) as ProblemPageResponse[];

        const questionNumberPageIdMapping: Mapping = {}
        pages.filter(page => page.properties['Question Number'].number !== null)
            .forEach(page => {
                const questionNumber = page.properties['Question Number'].number;
                if (!questionNumber) return;
                questionNumberPageIdMapping[questionNumber.toString()] = page.id;
            })
        globalState.setQuestionNumberPageIdMapping(questionNumberPageIdMapping);
    }

    public getPageIdOfQuestion(questionNumber: string): string | null {
        const mapping: Mapping | undefined = globalState.getQuestionNumberPageIdMapping();
        if (!mapping || !mapping[questionNumber]) {
            return null;
        }
        return mapping[questionNumber];
    }

    public async submitSolution(questionNumber: string) {
        if (!hasNotionIntegrationEnabled()) return;
        try {
            const updateResponse = await this.updateStatusOfQuestion(questionNumber);
            const submission = await leetcodeClient.getRecentSubmission();
            if(!submission) {
                throw new Error(`no-recent-submission`);
            }
            const pageId = updateResponse.id;
            const submissionPageId = await this.createSubmissionPage(pageId, submission);
            await this.addCodeToPage(submissionPageId, submission.lang, submission.code);
        } catch (error) {
            promptForOpenOutputChannel(`Failed to update notion for your submission`, DialogType.error);
            leetCodeChannel.appendLine(`Failed to update notion for your submission: ${error}`);
        }
    }

    public async updateStatusOfQuestion(questionNumber: string, check: boolean = true): Promise<PageObjectResponse<QueryProblemPageProperties>> {
        try {
            if (!this.isSignedIn || !this.notion) {
                throw new Error("notion-integration-not-enabled");
            }
            const pageId = this.getPageIdOfQuestion(questionNumber);
            if (!pageId) {
                throw new Error("question-not-available");
            }
            const response = await this.notion.pages.update({
                page_id: pageId,
                properties: {
                    Status: {
                        checkbox: check
                    }
                }
            })
            return response as PageObjectResponse<QueryProblemPageProperties>
        } catch (error) {
            throw new Error(`Failed to update status of question in notion: ${error}`);
        }
    }

    public async createSubmissionPage(questionPageId: string, submission: Submission): Promise<string> {
        try {
            if (!this.isSignedIn || !this.notion) {
                throw new Error("notion-integration-not-enabled");
            }
            const submissionsDatabaseId = globalState.getSubmissionsDatabaseId();
            if (!submissionsDatabaseId) {
                throw new Error("no-submissions-database")
            };
            const response = await this.notion.pages.create({
                parent: {
                    database_id: submissionsDatabaseId,
                },
                properties: {
                    title: {
                        title: [
                            {
                                text: {
                                    content: submission.title,
                                },
                            },
                        ],
                    },
                    'Time Submitted': {
                        date: {
                            start: getISODate(submission.timestamp * 1000)
                        }
                    },
                    Language: {
                        select: {
                            name: _.startCase(submission.lang)
                        }
                    },
                    Question: {
                        relation: [{
                            id: questionPageId
                        }]
                    },
                    Status: {
                        select: {
                            name: 'Accepted',
                        }
                    },
                    'Submission ID': {
                        rich_text: [{
                            text: {
                                content: submission.id.toString()
                            }
                        }]
                    }
                }
            })
            return response.id;
        } catch (error) {
            throw new Error(`Failed to create submission: ${error}`);
        }
    }

    public async addCodeToPage(pageId: string, lang: string, code: string) {
        if(!shouldAddCodeToSubmissionPage()) return;
        try {
            if (!this.isSignedIn || !this.notion) {
                throw new Error("notion-integration-not-enabled");
            }
            const codeChunks = splitTextIntoChunks(code);
            await this.notion.blocks.children.append({
                block_id: pageId,
                children: [{
                    object: 'block',
                    type: 'code',
                    code: {
                        language: getNotionLang(lang),
                        rich_text: codeChunks.map(codeChunk => ({
                            text: {
                                content: codeChunk
                            }
                        }))
                    }
                }]
            })
        } catch (error) {
            throw new Error(`Failed to add code to page: ${error}`);
        }
    }
}

export const leetnotionClient: LeetnotionClient = new LeetnotionClient();
