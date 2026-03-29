// Copyright (c) leetnotion. All rights reserved.
// Licensed under the MIT license.

import axios from 'axios';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import { globalState } from '../globalState';
import { leetCodeChannel } from '../leetCodeChannel';
import { leetcodeClient } from '../leetCodeClient';
import {
	CompanyTags,
	Lists,
	ListsWithQuestions,
	Mapping,
	ProblemRatingMap,
	QuestionCompanyTags,
	Sheets,
	TopicTags,
} from '../types';
import { getStaticRatings, getStaticTopicTags } from './staticDataUtils';
import { sleep } from './toolUtils';

const sheetsPath = '../../data/sheets.json';
const companyTagsPath = '../../data/companyTags.json';
const questionCompanyTagsPath = '../../data/questionCompanyTags.json';

export function getSheets(): Sheets {
	const sheets = fsExtra.readJSONSync(path.join(__dirname, sheetsPath)) as Sheets;
	return sheets;
}

export function getCompanyTags(): CompanyTags {
	const companyTags = fsExtra.readJSONSync(path.join(__dirname, companyTagsPath)) as CompanyTags;
	return companyTags;
}

export function getQuestionCompanyTags(): QuestionCompanyTags {
	return fsExtra.readJSONSync(path.join(__dirname, questionCompanyTagsPath)) as QuestionCompanyTags;
}

export async function getContests(): Promise<Record<string, string[]>> {
	try {
		return await globalState.getWithBackgroundRefresh<Record<string, string[]>>(
			'leetcodeContests',
			async () => {
				const { data } = await axios.get(
					'https://raw.githubusercontent.com/codewithsathya/leetcode-contests/refs/heads/main/contestData.json',
				);
				return data;
			},
		);
	} catch (error) {
		console.error(`Failed to fetch contests: ${error}`);
		return {};
	}
}

export async function getTopicTags(): Promise<Record<string, string[]>> {
	const topicTags = {};
	const questionTopicTags = await getQuestionTopicTags();
	for (const problem of Object.keys(questionTopicTags)) {
		const tags = questionTopicTags[problem];
		for (const tag of tags) {
			if (topicTags[tag]) {
				topicTags[tag].push(problem);
			} else {
				topicTags[tag] = [problem];
			}
		}
	}
	return topicTags;
}

export async function getQuestionTopicTags(): Promise<TopicTags> {
	const cached = globalState.getTopicTags();
	if (cached) {
		return cached;
	}
	// Kick off background API fetch to populate cache
	leetcodeClient
		.getTopicTags()
		.then((fresh) => {
			globalState.setTopicTags(fresh);
		})
		.catch((err) => {
			leetCodeChannel.appendLine(`Failed to refresh topic tags: ${err}`);
		});
	// Return static data immediately
	return getStaticTopicTags();
}

export async function getProblemRatingMap(): Promise<ProblemRatingMap> {
	const cached = globalState.getProblemRatingMap();
	if (cached) {
		return cached;
	}
	// Kick off background API fetch to populate cache
	leetcodeClient
		.getProblemRatingsMap()
		.then((fresh) => {
			globalState.setProblemRatingMap(fresh);
		})
		.catch((err) => {
			leetCodeChannel.appendLine(`Failed to refresh problem ratings: ${err}`);
		});
	// Return static data immediately
	return getStaticRatings();
}

export async function setProblemRatingMap() {
	const problemRatingMap = await leetcodeClient.getProblemRatingsMap();
	globalState.setProblemRatingMap(problemRatingMap);
}

export function getCompanyPopularity(): Record<string, number> {
	const companyTags = getCompanyTags();
	const companyPoularityMapping: Record<string, number> = {};
	for (const [company, data] of Object.entries(companyTags)) {
		const problems = extractArrayElements(data);
		companyPoularityMapping[company] = problems.length;
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
		throw new Error(`title-slug-question-number-mapping-not-found`);
	}
	const mapping: Mapping = {};
	for (const [slug, questionNumber] of Object.entries(titleSlugQuestionNumberMapping)) {
		mapping[slug] = questionNumberPageIdMapping[questionNumber];
	}
	return mapping;
}

export async function getLists(): Promise<Lists> {
	let lists = globalState.getLists();
	if (!lists) {
		lists = await leetcodeClient.getLists();
		globalState.setLists(lists);
	}
	return lists;
}

export async function getListsWithQuestions(): Promise<ListsWithQuestions> {
	const lists = await getLists();
	const listsDetails: ListsWithQuestions = {};
	if (lists) {
		for (const list of lists) {
			const questions = await globalState.getQuestionsOfList(list.slug);
			listsDetails[list.name] = questions.map((item) => item.questionFrontendId);
		}
	}
	return listsDetails;
}

export async function syncLists() {
	await setLists();
	await setQuestionsOfAllLists();
	globalState.setListsSyncTimestamp(Date.now());
}

export async function syncListsIfNeeded(intervalMs: number) {
	const lastSync = globalState.getListsSyncTimestamp();
	if (lastSync && Date.now() - lastSync < intervalMs) {
		return;
	}
	await syncLists();
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

export function extractArrayElements(data) {
	let result = [];

	function recurse(value) {
		if (Array.isArray(value)) {
			result.push(...value);
			value.forEach((item) => recurse(item));
		} else if (typeof value === 'object' && value !== null) {
			Object.values(value).forEach((val) => recurse(val));
		}
	}

	recurse(data);
	result = [...new Set(result)];
	return result;
}
