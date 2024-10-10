// Copyright (c) leetnotion. All rights reserved.
// Licensed under the MIT license.

import * as fsExtra from 'fs-extra';
import * as path from 'path';
import { leetcodeClient } from '../leetCodeClient';
import { globalState } from '../globalState';
import { leetCodeChannel } from '../leetCodeChannel';

const sheetsPath = '../../../data/sheets.json';
const companyTagsPath = '../../../data/companyTags.json';

type Sheets = Record<string, Record<string, string[]>>;
type CompanyTags = Record<string, string[]>;
type TopicTags = Record<string, string[]>;

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
