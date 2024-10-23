// Copyright (c) leetnotion. All rights reserved.
// Licensed under the MIT license.

import * as fsExtra from 'fs-extra';
import * as path from 'path';
import { leetcodeClient } from '../leetCodeClient';
import { globalState } from '../globalState';
import { leetCodeChannel } from '../leetCodeChannel';
import { CompanyTags, Mapping, Sheets, TopicTags } from '../types';

const sheetsPath = '../../../data/sheets.json';
const companyTagsPath = '../../../data/companyTags.json';

export function getSheets(): Sheets {
    const sheets = fsExtra.readJSONSync(path.join(__dirname, sheetsPath)) as Sheets;
    return sheets;
}

export function getCompanyTags(): CompanyTags {
    const companyTags = fsExtra.readJSONSync(path.join(__dirname, companyTagsPath)) as CompanyTags;
    return companyTags;
}

export async function getTopicTags(): Promise<TopicTags> {
    let topicTags = globalState.getTopicTags();

    if (!topicTags) {
        topicTags = await leetcodeClient.getTopicTags();
        globalState.setTopicTags(topicTags);
    } else {
        leetcodeClient.getTopicTags().then(freshTags => {
            globalState.setTopicTags(freshTags);
        }).catch(error => {
            leetCodeChannel.appendLine(`Failed to update topic tags in the background: ${error}`);
        });
    }

    return topicTags;
}

export function getCompanyPopularity(): Record<string, number> {
    const companyTags = getCompanyTags();
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
    if(!questionNumberPageIdMapping) {
        throw new Error(`question-number-page-id-mapping-not-found`);
    }
    const titleSlugQuestionNumberMapping = globalState.getTitleSlugQuestionNumberMapping();
    if(!titleSlugQuestionNumberMapping) {
        throw new Error(`title-slug-question-number-mapping-not-found`);;
    }
    const mapping: Mapping = {};
    for(const [slug, questionNumber] of Object.entries(titleSlugQuestionNumberMapping)) {
        mapping[slug] = questionNumberPageIdMapping[questionNumber];
    }
    return mapping;
}
