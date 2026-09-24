// scripts/generate-static-data.ts
import { LeetCodeAdvanced, LeetCodeCLI } from '@leetnotion/leetcode-api';
import axios from 'axios';
import * as fs from 'fs';
import _ from 'lodash';
import * as path from 'path';

const dataDir = path.join(__dirname, '..', 'data');

async function generate() {
	const leetcode = new LeetCodeAdvanced();
	const cli = new LeetCodeCLI();

	// 1. Category problems (unauthenticated — no user state)
	console.log('Fetching category problems...');
	const problems = await cli.allCategoryProblems();
	const staticProblems = problems
		.map((p) => ({
			id: String(p.fid),
			questionId: p.id,
			name: p.name,
			slug: p.slug,
			category: p.category,
			difficulty: p.level,
			passRate: `${p.percent.toFixed(2)}%`,
			locked: p.locked,
		}))
		.sort((a, b) => Number(a.id) - Number(b.id));
	fs.writeFileSync(path.join(dataDir, 'categoryProblems.json'), JSON.stringify(staticProblems));
	console.log(`Wrote ${staticProblems.length} problems`);

	// 2. Topic tags — store in RAW format (questionId → tagNames[])
	// This matches what getQuestionTopicTags() returns from the API
	console.log('Fetching topic tags...');
	const topicTagsRaw = await leetcode.topicTags();
	fs.writeFileSync(path.join(dataDir, 'topicTags.json'), JSON.stringify(topicTagsRaw));
	console.log(`Wrote topic tags for ${Object.keys(topicTagsRaw).length} problems`);

	// 3. Problem ratings
	console.log('Fetching problem ratings...');
	const { data } = await axios.get('https://zerotrac.github.io/leetcode_problem_rating/data.json');
	const ratingsMap: Record<
		string,
		{ Rating: number; ProblemIndex: string; ID: number; ContestID_en: string }
	> = {};
	for (const rating of data) {
		ratingsMap[String(rating.ID)] = {
			ID: rating.ID,
			Rating: _.floor(rating.Rating),
			ProblemIndex: rating.ProblemIndex,
			ContestID_en: rating.ContestID_en,
		};
	}
	fs.writeFileSync(path.join(dataDir, 'ratings.json'), JSON.stringify(ratingsMap));
	console.log(`Wrote ${Object.keys(ratingsMap).length} ratings`);

	// 4. Contests — derived from the ratings data, since LeetCode's contest info API is
	// behind a Cloudflare challenge. Ratings don't cover the oldest contests, so only
	// contests missing from contests.json are added; existing entries are kept as-is.
	const contestsPath = path.join(dataDir, 'contests.json');
	const existingContests: Record<string, string[]> = JSON.parse(
		fs.readFileSync(contestsPath, 'utf-8'),
	);
	const newContests: Record<string, { ProblemIndex: string; ID: number }[]> = {};
	for (const rating of data) {
		if (!existingContests[rating.ContestID_en]) {
			(newContests[rating.ContestID_en] ??= []).push(rating);
		}
	}
	// Tree renders contests in key order, so keep newest (highest problem ID) first
	const newEntries = _.fromPairs(
		_.sortBy(Object.entries(newContests), ([, problems]) => -_.max(problems.map((p) => p.ID))!).map(
			([title, problems]) => [
				title,
				_.sortBy(problems, (p) => p.ProblemIndex).map((p) => String(p.ID)),
			],
		),
	);
	fs.writeFileSync(contestsPath, JSON.stringify({ ...newEntries, ...existingContests }));
	console.log(
		`Added ${Object.keys(newEntries).length} new contests: ${Object.keys(newEntries).join(', ')}`,
	);

	// 5. Contest details — from the past contests GraphQL query, newest first.
	// The API caps each page at 30 contests regardless of the requested limit.
	console.log('Fetching contest details...');
	const pageSize = 30;
	const contestDetails: { slug: string; title: string; startTime: number; duration: number }[] = [];
	let totalContests = Infinity;
	for (let skip = 0; skip < totalContests; skip += pageSize) {
		const { totalNum, contests } = await leetcode.getPastContests({ limit: pageSize, skip });
		totalContests = totalNum;
		if (contests.length === 0) {
			break;
		}
		contestDetails.push(
			...contests.map((c) => ({
				slug: c.titleSlug,
				title: c.title,
				startTime: c.startTime,
				duration: c.duration,
			})),
		);
	}
	const uniqueContestDetails = _.uniqBy(contestDetails, (c) => c.slug);
	fs.writeFileSync(path.join(dataDir, 'contestDetails.json'), JSON.stringify(uniqueContestDetails));
	console.log(`Wrote ${uniqueContestDetails.length} contest details`);

	console.log('Done!');
}

generate().catch(console.error);
