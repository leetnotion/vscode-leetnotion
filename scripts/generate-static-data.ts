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

	// 4. Contest data — contest name → array of problem frontend IDs
	console.log('Fetching contest data...');
	const slugToId: Record<string, string> = {};
	for (const p of staticProblems) {
		slugToId[p.slug] = p.id;
	}

	const contestData: Record<string, string[]> = {};
	const totalContests = (await leetcode.getPastContests({ limit: 1 })).totalNum;
	const pageSize = 50;

	for (let skip = 0; skip < totalContests; skip += pageSize) {
		const { contests } = await leetcode.getPastContests({ limit: pageSize, skip });
		for (const contest of contests) {
			try {
				const { questions } = await leetcode.getContestQuestions(contest.titleSlug);
				const ids = questions.map((q) => slugToId[q.title_slug]).filter(Boolean);
				if (ids.length > 0) {
					contestData[contest.title] = ids;
				}
				console.log(`  ${contest.title}: ${ids.length} problems`);
			} catch (err) {
				console.error(`  Failed to fetch ${contest.title}: ${err}`);
			}
		}
	}
	fs.writeFileSync(path.join(dataDir, 'contests.json'), JSON.stringify(contestData));
	console.log(`Wrote ${Object.keys(contestData).length} contests`);

	console.log('Done!');
}

generate().catch(console.error);
