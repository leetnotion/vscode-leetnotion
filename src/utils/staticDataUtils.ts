// Copyright (c) leetnotion. All rights reserved.
// Licensed under the MIT license.

import * as fsExtra from 'fs-extra';
import * as path from 'path';
import { IProblem, ProblemState } from '../shared';
import { ProblemRatingMap, TopicTags } from '../types';

const categoryProblemsPath = '../../data/categoryProblems.json';
const topicTagsPath = '../../data/topicTags.json';
const ratingsPath = '../../data/ratings.json';
const contestsPath = '../../data/contests.json';

interface StaticProblem {
	id: string;
	name: string;
	slug: string;
	category: string;
	difficulty: string;
	passRate: string;
	locked: boolean;
}

export function getStaticProblems(): IProblem[] {
	const raw = fsExtra.readJSONSync(path.join(__dirname, categoryProblemsPath)) as StaticProblem[];
	return raw.map(
		(p): IProblem => ({
			id: p.id,
			name: p.name,
			slug: p.slug,
			difficulty: p.difficulty,
			passRate: p.passRate,
			locked: p.locked,
			state: ProblemState.Unknown,
			isFavorite: false,
			companies: [],
			tags: [],
		}),
	);
}

export function getStaticTopicTags(): TopicTags {
	return fsExtra.readJSONSync(path.join(__dirname, topicTagsPath)) as TopicTags;
}

export function getStaticRatings(): ProblemRatingMap {
	return fsExtra.readJSONSync(path.join(__dirname, ratingsPath)) as ProblemRatingMap;
}

export function getStaticContests(): Record<string, string[]> {
	return fsExtra.readJSONSync(path.join(__dirname, contestsPath)) as Record<string, string[]>;
}
