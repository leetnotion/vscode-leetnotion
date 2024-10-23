import { ProgressLocation, window } from 'vscode';
import { IS_PROBLEMS_RETRIEVED, LEETCODE_PROBLEMS, UPDATED_PAGES } from "../../constants";
import { leetCodeChannel } from "../../leetCodeChannel";
import { DialogType, promptForOpenOutputChannel } from "../../utils/uiUtils";
import { templateUpdateSession } from "./session";
import { leetcodeClient } from "../../leetCodeClient";
import { hasNotionIntegrationEnabled } from "../../utils/settingUtils";
import { globalState } from "../../globalState";
import { leetnotionClient } from "../../leetnotionClient";
import { LeetcodeProblem, ProblemPageResponse } from '../../types';

export class TemplateUpdater {
    public async updateTemplate() {
        try {
            if (!hasNotionIntegrationEnabled()) {
                leetCodeChannel.appendLine(`Failed to update notion template. Notion integration not enabled. Enable notion integration and complete the setup.`)
                promptForOpenOutputChannel(`Failed to update notion template. Notion integration not enabled.`, DialogType.error);
                return;
            }
            await templateUpdateSession.init();
            await this.retrieveLeetcodeProblems();
            await this.addNewProblems();
            await this.updateProblems();
            promptForOpenOutputChannel(`Updated leetnotion template successfully 🥳.`, DialogType.completed);
            await templateUpdateSession.close();
        } catch (error) {
            if(error.message === "updating-cancelled") {
                promptForOpenOutputChannel(`Updating template cancelled. You can resume it later.`, DialogType.completed);
                return;
            }
            leetCodeChannel.appendLine(`Failed to update leetnotion template: ${error}`);
            promptForOpenOutputChannel(`Failed to update leetnotion template`, DialogType.error);
        }
    }

    public async retrieveLeetcodeProblems() {
        const problemsRetrieved = await templateUpdateSession.get(IS_PROBLEMS_RETRIEVED) as boolean;
        let problems: LeetcodeProblem[] = [];
        if (!problemsRetrieved) {
            const noOfProblems = await leetcodeClient.getNoOfProblems();
            let noOfProblemsCollected = 0;
            await window.withProgress(
                {
                    location: ProgressLocation.Notification,
                    cancellable: false,
                    title: `Fetching leetcode problems`,
                },
                async progress => {
                    progress.report({ increment: 0 });
                    problems = await leetcodeClient.getLeetcodeProblems(problems => {
                        progress.report({
                            increment: (problems.length - noOfProblemsCollected) * 100 / noOfProblems
                        })
                        noOfProblemsCollected = problems.length;
                    });
                }

            );
            await templateUpdateSession.update(LEETCODE_PROBLEMS, problems);
            await templateUpdateSession.update(IS_PROBLEMS_RETRIEVED, true);
        } else {
            problems = templateUpdateSession.get(LEETCODE_PROBLEMS) as LeetcodeProblem[];
        }
        return problems;
    }

    public async addNewProblems() {
        const problems = templateUpdateSession.get(LEETCODE_PROBLEMS) as LeetcodeProblem[] | undefined;
        if (!problems) {
            throw new Error(`leetcode-problems-not-found`);
        }
        const questionNumberPageIdMapping = globalState.getQuestionNumberPageIdMapping();
        if (!questionNumberPageIdMapping) {
            throw new Error(`question-number-page-id-mapping-not-found`);
        }
        const newProblems = problems.filter(({ questionFrontendId }) => !(questionFrontendId in questionNumberPageIdMapping))
        let responses: ProblemPageResponse[] = [];
        let count = 0;
        let noOfPages = newProblems.length;

        await window.withProgress(
            {
                location: ProgressLocation.Notification,
                cancellable: false,
                title: 'Adding problems',
            },
            async progress => {
                progress.report({ increment: 0 });
                responses = await leetnotionClient.addProblems(newProblems, async response => {
                    const title = response.properties.Name.title[0].text.content;
                    const questionNumber = response.properties['Question Number'].number;
                    if (!questionNumber) {
                        throw new Error(`question-number-not-found-in-page`);
                    }
                    questionNumberPageIdMapping[questionNumber.toString()] = response.id;
                    globalState.setQuestionNumberPageIdMapping(questionNumberPageIdMapping);
                    count += 1;
                    progress.report({
                        increment: (1 / noOfPages) * 100,
                        message: `(${count}/${noOfPages}) ${title} added.`,
                    });
                })
            }
        );
        return responses;
    }

    public async updateProblems() {
        const problems = templateUpdateSession.get(LEETCODE_PROBLEMS) as LeetcodeProblem[] | undefined;
        if (!problems) {
            throw new Error(`leetcode-problems-not-found`);
        }
        const updatedPagesMapping = templateUpdateSession.get(UPDATED_PAGES) as Record<string, string>;
        const problemsToUpdate = problems.filter(({ questionFrontendId }) => !(questionFrontendId in updatedPagesMapping));
        problemsToUpdate.sort((a, b) => Number(b.questionFrontendId) - Number(a.questionFrontendId));

        const noOfPages = problemsToUpdate.length;
        let responses: ProblemPageResponse[] = [];
        let count = 0;
        await window.withProgress(
            {
                location: ProgressLocation.Notification,
                cancellable: true,
                title: 'Updating problems',
            },
            async (progress, cancellationToken) => {
                progress.report({ increment: 0 });
                responses = await leetnotionClient.updateProblems(problemsToUpdate, async response => {
                    const questionNumber = response.properties['Question Number'].number;
                    if (!questionNumber) {
                        throw new Error(`question-number-not-found-in-page`);
                    }
                    const title = response.properties.Name.title[0].text.content;
                    updatedPagesMapping[questionNumber] = response.id;
                    await templateUpdateSession.update(UPDATED_PAGES, updatedPagesMapping);
                    count += 1;
                    progress.report({
                        increment: (1 / noOfPages) * 100,
                        message: `(${count}/${noOfPages}) ${title} updated`
                    })
                    if(cancellationToken.isCancellationRequested) {
                        throw new Error(`updating-cancelled`);
                    }
                })
            }
        )
        return responses;
    }
}

export const templateUpdater: TemplateUpdater = new TemplateUpdater();
