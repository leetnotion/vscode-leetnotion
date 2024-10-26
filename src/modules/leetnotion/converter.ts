import { OfficialSolution, ProblemDifficulty, SimilarQuestion, Stats, TopicTag } from "@leetnotion/leetcode-api";
import { CreateProblemPageProperties, LeetcodeProblem, LeetnotionSubmission, UpdateProblemPageProperties } from "../../types";
import { getTitleSlugPageIdMapping } from "../../utils/dataUtils";
import { getISODate, getNotionLang, startCase } from "../../utils/toolUtils";

export class LeetCodeToNotionConverter {
    static convertProblemToCreatePage(problem: LeetcodeProblem) {
        const solution = JSON.parse(JSON.stringify(problem.solution)) as OfficialSolution | null;
        let solutionFreeOrPaid: 'Free' | 'Paid' | 'Not available' = 'Not available';
        let videoSolutionAvailable = false;
        if (solution !== null) {
            solutionFreeOrPaid = (problem.solution as OfficialSolution).paidOnly ? 'Free' : 'Paid';
            videoSolutionAvailable = (problem.solution as OfficialSolution).hasVideoSolution;
        }

        const problemPageProperties: CreateProblemPageProperties = {
            Name: {
                title: [
                    {
                        text: {
                            content: problem.title as string,
                        },
                    },
                ],
            },
            Difficulty: {
                select: {
                    name: problem.difficulty as ProblemDifficulty,
                },
            },
            'Question Tags': {
                multi_select: (problem.topicTags as TopicTag[]).map(topicTag => ({
                    name: topicTag.name,
                })),
            },
            'Company Tags': {
                multi_select: [],
            },
            Slug: {
                rich_text: [
                    {
                        text: {
                            content: problem.titleSlug as string,
                        },
                    },
                ],
            },
            URL: {
                url: `https://leetcode.com/problems/${problem.titleSlug}`,
            },
            Frequency: {
                number: 0,
            },
            'Question Number': {
                number: parseInt(problem.questionFrontendId as string, 10),
            },
            Solution: {
                url: `https://leetcode.com/problems/${problem.titleSlug}/editorial`,
            },
            'Free or Paid': {
                select: {
                    name: (problem.isPaidOnly as boolean) ? 'Paid' : 'Free',
                },
            },
            'Solution Free or Paid': {
                select: {
                    name: solutionFreeOrPaid,
                },
            },
            'Video Solution': {
                checkbox: videoSolutionAvailable,
            },
            Likes: {
                number: problem.likes as number,
            },
            Dislikes: {
                number: problem.dislikes as number,
            },
            'Total Submissions': {
                number: (problem.stats as Stats).totalSubmissionRaw,
            },
            'Total Accepted': {
                number: (problem.stats as Stats).totalAcceptedRaw,
            },
            Type: {
                multi_select: (problem.type as string[]).map(type => ({
                    name: type,
                })),
            },
        };
        return problemPageProperties;
    }

    static convertProblemToUpdatePage(
        problem: LeetcodeProblem,
    ) {
        const solution = JSON.parse(JSON.stringify(problem.solution)) as OfficialSolution | null;
        const slugPageIdMapping = getTitleSlugPageIdMapping();
        let solutionFreeOrPaid: 'Free' | 'Paid' | 'Not available' = 'Not available';
        let videoSolutionAvailable = false;
        if (solution !== null) {
            solutionFreeOrPaid = (problem.solution as OfficialSolution).paidOnly ? 'Free' : 'Paid';
            videoSolutionAvailable = (problem.solution as OfficialSolution).hasVideoSolution;
        }

        const problemPageProperties: UpdateProblemPageProperties = {
            Name: {
                title: [
                    {
                        text: {
                            content: problem.title as string,
                        },
                    },
                ],
            },
            Difficulty: {
                select: {
                    name: problem.difficulty as ProblemDifficulty,
                },
            },
            'Question Tags': {
                multi_select: (problem.topicTags as TopicTag[]).map(topicTag => ({
                    name: topicTag.name,
                })),
            },
            Slug: {
                rich_text: [
                    {
                        text: {
                            content: problem.titleSlug as string,
                        },
                    },
                ],
            },
            URL: {
                url: `https://leetcode.com/problems/${problem.titleSlug}`,
            },
            'Question Number': {
                number: parseInt(problem.questionFrontendId as string, 10),
            },
            Solution: {
                url: `https://leetcode.com/problems/${problem.titleSlug}/editorial`,
            },
            'Free or Paid': {
                select: {
                    name: (problem.isPaidOnly as boolean) ? 'Paid' : 'Free',
                },
            },
            'Solution Free or Paid': {
                select: {
                    name: solutionFreeOrPaid,
                },
            },
            'Video Solution': {
                checkbox: videoSolutionAvailable,
            },
            Likes: {
                number: problem.likes as number,
            },
            Dislikes: {
                number: problem.dislikes as number,
            },
            'Total Submissions': {
                number: (problem.stats as Stats).totalSubmissionRaw,
            },
            'Total Accepted': {
                number: (problem.stats as Stats).totalAcceptedRaw,
            },
            Type: {
                multi_select: (problem.type as string[]).map(type => ({
                    name: type,
                })),
            },
            'Similar Questions': {
                relation: (problem.similarQuestions as SimilarQuestion[]).map(question => ({
                    id: slugPageIdMapping[question.titleSlug as string],
                })),
            },
        };
        return problemPageProperties;
    }

    static convertSubmissionToSubmissionPage(submission: LeetnotionSubmission, questionPageId: string) {
        return {
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
                    start: getISODate(submission.timestamp),
                },
            },
            Language: {
                select: {
                    name: startCase(getNotionLang(submission.lang)),
                },
            },
            Question: {
                relation: [
                    {
                        id: questionPageId,
                    },
                ],
            },
            Status: {
                select: {
                    name: submission.status_display,
                },
            },
            'Submission ID': {
                rich_text: [
                    {
                        text: {
                            content: submission.id.toString(),
                        },
                    },
                ],
            },
        };
    }
}
