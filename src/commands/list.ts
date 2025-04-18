// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { leetCodeChannel } from "../leetCodeChannel";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { leetCodeManager } from "../leetCodeManager";
import { IProblem, ProblemState, UserStatus } from "../shared";
import { getProblemRatingMap, getQuestionCompanyTags, getQuestionTopicTags } from "../utils/dataUtils";
import * as settingUtils from "../utils/settingUtils";
import { DialogType, promptForOpenOutputChannel } from "../utils/uiUtils";

export async function listProblems(): Promise<IProblem[]> {
    try {
        if (leetCodeManager.getStatus() === UserStatus.SignedOut) {
            return [];
        }

        const useEndpointTranslation: boolean = settingUtils.shouldUseEndpointTranslation();
        const result: string = await leetCodeExecutor.listProblems(true, useEndpointTranslation);
        const problems: IProblem[] = [];
        const lines: string[] = result.split("\n");
        const reg: RegExp = /^(.)\s(.{1,2})\s(.)\s\[\s*(\d*)\s*\]\s*(.*)\s*(Easy|Medium|Hard)\s*\((\s*\d+\.\d+ %)\)/;
        const companies = getQuestionCompanyTags();
        const tags = await getQuestionTopicTags();
        const problemRatingMap = await getProblemRatingMap();
        for (const line of lines) {
            const match: RegExpMatchArray | null = line.match(reg);
            if (match && match.length === 8) {
                const id: string = match[4].trim();
                problems.push({
                    id,
                    isFavorite: match[1].trim().length > 0,
                    locked: match[2].trim().length > 0,
                    state: parseProblemState(match[3]),
                    name: match[5].trim(),
                    difficulty: match[6].trim(),
                    passRate: match[7].trim(),
                    companies: companies[id] || ["Unknown"],
                    tags: tags[id] || ["Unknown"],
                    rating: problemRatingMap[id]?.Rating,
                    problemIndex: problemRatingMap[id]?.ProblemIndex,
                });
            }
        }
        return problems.reverse();
    } catch (error) {
        await promptForOpenOutputChannel("Failed to list problems. Please open the output channel for details.", DialogType.error);
        leetCodeChannel.append(error);
        return [];
    }
}

function parseProblemState(stateOutput: string): ProblemState {
    if (!stateOutput) {
        return ProblemState.Unknown;
    }
    switch (stateOutput.trim()) {
        case "v":
        case "✔":
        case "√":
            return ProblemState.AC;
        case "X":
        case "✘":
        case "×":
            return ProblemState.NotAC;
        default:
            return ProblemState.Unknown;
    }
}
