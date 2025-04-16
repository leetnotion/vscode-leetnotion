// Copyright (c) leetnotion. All rights reserved.
// Licensed under the MIT license.

import * as fsExtra from 'fs-extra';
import * as path from 'path';
import { leetcodeClient } from '../leetCodeClient';
import { globalState } from '../globalState';
import { leetCodeChannel } from '../leetCodeChannel';
import { QuestionCompanyTags, Lists, Mapping, QuestionsOfList, Sheets, TopicTags, CompanyTags } from '../types';
import Bottleneck from 'bottleneck';
import { sleep } from './toolUtils';
import { ALL_TIME } from '@/shared';

const sheetsPath = '../../data/sheets.json';
const companyTagsPath = '../../data/companyTags.json';
const questionCompanyTagsPath = '../../data/questionCompanyTags.json';

export function getSheets(): Sheets {
    const sheets = fsExtra.readJSONSync(path.join(__dirname, sheetsPath)) as Sheets;
    return sheets;
}

export function getCompanyTags() {
    const companyTags = fsExtra.readJSONSync(path.join(__dirname, companyTagsPath)) as CompanyTags;
    let finalCompanyTags = {};
    for(const [company, details] of Object.entries(companyTags)) {
        if(Object.keys(details).length === 1) {
            finalCompanyTags[company] = details[ALL_TIME].map(item => item.id);
        } else {
            finalCompanyTags[company] = {}
            for(const timeframe of Object.keys(details)) {
                console.log(details);
                finalCompanyTags[company][timeframe] = details[timeframe].map(item => item.id);
            }
        }
    }
    return finalCompanyTags;
}

export function getQuestionCompanyTags(): QuestionCompanyTags {
    return fsExtra.readJSONSync(path.join(__dirname, questionCompanyTagsPath)) as QuestionCompanyTags;
}

export async function getTopicTags(): Promise<TopicTags> {
    let topicTags = globalState.getTopicTags();

    if (!topicTags) {
        topicTags = await leetcodeClient.getTopicTags();
        globalState.setTopicTags(topicTags);
    }

    return topicTags;
}

export function getCompanyPopularity(): Record<string, number> {
    const companyTags = getQuestionCompanyTags();
    const companyPoularityMapping: Record<string, number> = {};
    for (const problemId of Object.keys(companyTags)) {
        for (const company of companyTags[problemId]) {
            if (companyPoularityMapping[company] === undefined) {
                companyPoularityMapping[company] = 0;
            }
            companyPoularityMapping[company] += 1;
        }
    }
    return companyPoularityMapping;
}

export function getTitleSlugPageIdMapping() {
    const questionNumberPageIdMapping = globalState.getQuestionNumberPageIdMapping();
    if (!questionNumberPageIdMapping) {
        throw new Error(`question-number-page-id-mapping-not-found`);
    }
    const titleSlugQuestionNumberMapping = globalState.getTitleSlugQuestionNumberMapping();
    if (!titleSlugQuestionNumberMapping) {
        throw new Error(`title-slug-question-number-mapping-not-found`);;
    }
    const mapping: Mapping = {};
    for (const [slug, questionNumber] of Object.entries(titleSlugQuestionNumberMapping)) {
        mapping[slug] = questionNumberPageIdMapping[questionNumber];
    }
    return mapping;
}

const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1000,
});

const rateLimitedGetQuestionsOfList = limiter.wrap(
    async (slug: string): Promise<QuestionsOfList> => {
        return leetcodeClient.getQuestionsOfList(slug);
    }
);

export async function getLists(): Promise<Lists> {
    let lists = globalState.getLists();
    if (!lists) {
        lists = await leetcodeClient.getLists();
        globalState.setLists(lists);
    }
    return lists;
}

export async function setLists() {
    const lists = await leetcodeClient.getLists();
    globalState.setLists(lists);
}

export async function setQuestionsOfAllLists() {
    const lists = await getLists();
    for (const { name, slug } of lists) {
        try {
            const questions = await leetcodeClient.getQuestionsOfList(slug);
            await globalState.setQuestionsOfList(questions, slug);
            leetCodeChannel.appendLine(`Updated questions of ${name} list`);
            await sleep(1000);
        } catch (error) {
            leetCodeChannel.appendLine(`Failed to update questions of list: ${error}`);
        }
    }
}
