// Copyright (c) leetnotion. All rights reserved.
// Licensed under the MIT license.

import * as fsExtra from 'fs-extra';
import * as path from 'path';

const sheetsPath = '../../../data/sheets.json';
const companyTagsPath = '../../../data/companyTags.json';
const topicTagsPath = '../../../data/topicTags.json';

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

export function getTopicTags(): TopicTags {
    const topicTags = fsExtra.readJSONSync(path.join(__dirname, topicTagsPath)) as TopicTags;
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
