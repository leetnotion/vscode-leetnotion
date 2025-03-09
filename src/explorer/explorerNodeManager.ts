// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as _ from "lodash";
import { Disposable } from "vscode";
import * as list from "../commands/list";
import { getSortingStrategy } from "../commands/plugin";
import { Category, CompanySortingStrategy, defaultProblem, ProblemRating, ProblemState, SortingStrategy } from "../shared";
import { getCompaniesSortingStrategy, shouldHideSolvedProblem } from "../utils/settingUtils";
import { LeetCodeNode } from "./LeetCodeNode";
import { globalState } from "../globalState";
import { getCompanyPopularity, getLists, getSheets } from "../utils/dataUtils";
import { List } from "@leetnotion/leetcode-api";
import { leetcodeClient } from "@/leetCodeClient";

class ExplorerNodeManager implements Disposable {
    private explorerNodeMap: Map<string, LeetCodeNode> = new Map<string, LeetCodeNode>();
    private companySet: Set<string> = new Set<string>();
    private tagSet: Set<string> = new Set<string>();
    private sheetSet: Set<string> = new Set<string>();
    private questionsOfList: Record<string, string[]> = {};
    private listSet: Set<List> = new Set<List>();
    private dailyProblem: string | undefined;

    public async refreshCache(): Promise<void> {
        this.dispose();
        const shouldHideSolved: boolean = shouldHideSolvedProblem();
        this.dailyProblem = globalState.getDailyProblem();
        const ratingsMap = await leetcodeClient.getProblemRatingsMap();
        for (const problem of await list.listProblems()) {
            if (shouldHideSolved && problem.state === ProblemState.AC) {
                continue;
            }
            const problemId = problem.id;
            if(ratingsMap[problemId]) {
                problem.rating = ratingsMap[problemId].Rating;
                problem.problemIndex = ratingsMap[problemId].ProblemIndex;
            }
            this.explorerNodeMap.set(problem.id, new LeetCodeNode(problem));
            for (const company of problem.companies) {
                this.companySet.add(company);
            }
            for (const tag of problem.tags) {
                this.tagSet.add(tag);
            }
        }
        const lists = await getLists();
        if (lists) {
            this.listSet.clear();
            for (const list of lists) {
                this.listSet.add(list);
                const questions = await globalState.getQuestionsOfList(list.slug);
                this.questionsOfList[list.slug] = questions.map(item => item.questionFrontendId);
            }
        }
        const sheets = getSheets();
        if (sheets) {
            for (const sheetName of Object.keys(sheets)) {
                this.sheetSet.add(sheetName);
            }
        }
    }

    public getRootNodes(): LeetCodeNode[] {
        return [
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: Category.All,
                name: Category.All,
            }), false),
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: Category.Difficulty,
                name: Category.Difficulty,
            }), false),
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: Category.Tag,
                name: Category.Tag,
            }), false),
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: Category.Company,
                name: Category.Company,
            }), false),
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: Category.Favorite,
                name: Category.Favorite,
            }), false),
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: Category.Daily,
                name: Category.Daily,
            }), false),
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: Category.Sheets,
                name: Category.Sheets,
            }), false),
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: Category.Lists,
                name: Category.Lists,
            }), false)
        ];
    }

    public getAllNodes(): LeetCodeNode[] {
        return this.applySortingStrategy(
            Array.from(this.explorerNodeMap.values()),
        );
    }

    public getAllDifficultyNodes(): LeetCodeNode[] {
        const res: LeetCodeNode[] = [];
        res.push(
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: `${Category.Difficulty}.Easy`,
                name: "Easy",
            }), false),
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: `${Category.Difficulty}.Medium`,
                name: "Medium",
            }), false),
            new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: `${Category.Difficulty}.Hard`,
                name: "Hard",
            }), false),
        );
        this.sortSubCategoryNodes(res, Category.Difficulty);
        return res;
    }

    public getAllCompanyNodes(): LeetCodeNode[] {
        const res: LeetCodeNode[] = [];
        for (const company of this.companySet.values()) {
            res.push(new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: `${Category.Company}.${company}`,
                name: _.startCase(company),
            }), false));
        }
        this.sortSubCategoryNodes(res, Category.Company);
        return res;
    }

    public getAllTagNodes(): LeetCodeNode[] {
        const res: LeetCodeNode[] = [];
        for (const tag of this.tagSet.values()) {
            res.push(new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: `${Category.Tag}.${tag}`,
                name: _.startCase(tag),
            }), false));
        }
        this.sortSubCategoryNodes(res, Category.Tag);
        return res;
    }

    public getNodeById(id: string): LeetCodeNode | undefined {
        return this.explorerNodeMap.get(id);
    }

    public getFavoriteNodes(): LeetCodeNode[] {
        const res: LeetCodeNode[] = [];
        for (const node of this.explorerNodeMap.values()) {
            if (node.isFavorite) {
                res.push(node);
            }
        }
        return this.applySortingStrategy(res);
    }

    public getDailyNode(): LeetCodeNode[] {
        return Array.from(this.explorerNodeMap.values()).filter(({ id }) => id == this.dailyProblem);
    }

    public getSheetNodes(): LeetCodeNode[] {
        const res: LeetCodeNode[] = [];
        for (const sheetName of this.sheetSet.values()) {
            res.push(new LeetCodeNode({ ...defaultProblem, id: `${Category.Sheets}.${sheetName}`, name: sheetName }, false));
        }
        return res;
    }

    public getListNodes(): LeetCodeNode[] {
        const res: LeetCodeNode[] = [];
        for (const list of this.listSet.values()) {
            res.push(new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: `${Category.Lists}.${list.slug}`,
                name: _.startCase(list.name),
            }), false))
        }
        res.sort((a, b) => a.name.localeCompare(b.name));
        this.sortSubCategoryNodes(res, Category.Lists);
        return res;
    }

    public getChildrenNodesById(id: string): LeetCodeNode[] {
        // The sub-category node's id is named as {Category.SubName}
        const metaInfo: string[] = id.split(".");
        const res: LeetCodeNode[] = [];

        if (metaInfo[0] === Category.Sheets) {
            const sheetName = metaInfo[1];
            for (const sublist of Object.keys(getSheets()[sheetName])) {
                res.push(
                    new LeetCodeNode(Object.assign({}, defaultProblem, {
                        id: `${Category.Sublist}.${sheetName}.${sublist}`,
                        name: sublist,
                    }), false),
                )
            }
            return res;
        }

        if (metaInfo[0] === Category.Sublist) {
            const questionIds = getSheets()[metaInfo[1]][metaInfo[2]];
            const ids = new Set<string>(questionIds);
            for (const node of this.explorerNodeMap.values()) {
                if (ids.has(node.id)) res.push(node);
            }
            res.sort((a, b) => questionIds.indexOf(a.id) - questionIds.indexOf(b.id));
            return res;
        }

        if (metaInfo[0] === Category.Lists) {
            const slug = metaInfo[1];
            const questionIds = this.questionsOfList[slug];
            const ids = new Set<string>(questionIds);
            for (const node of this.explorerNodeMap.values()) {
                if (ids.has(node.id)) res.push(node);
            }
            return res;
        }

        for (const node of this.explorerNodeMap.values()) {
            switch (metaInfo[0]) {
                case Category.Company:
                    if (node.companies.indexOf(metaInfo[1]) >= 0) {
                        res.push(node);
                    }
                    break;
                case Category.Difficulty:
                    if (node.difficulty === metaInfo[1]) {
                        res.push(node);
                    }
                    break;
                case Category.Tag:
                    if (node.tags.indexOf(metaInfo[1]) >= 0) {
                        res.push(node);
                    }
                    break;
                default:
                    break;
            }
        }
        return this.applySortingStrategy(res);
    }

    public dispose(): void {
        this.explorerNodeMap.clear();
        this.companySet.clear();
        this.tagSet.clear();
    }

    private sortSubCategoryNodes(subCategoryNodes: LeetCodeNode[], category: Category): void {
        switch (category) {
            case Category.Difficulty:
                subCategoryNodes.sort((a: LeetCodeNode, b: LeetCodeNode): number => {
                    function getValue(input: LeetCodeNode): number {
                        switch (input.name.toLowerCase()) {
                            case "easy":
                                return 1;
                            case "medium":
                                return 2;
                            case "hard":
                                return 3;
                            default:
                                return Number.MAX_SAFE_INTEGER;
                        }
                    }
                    return getValue(a) - getValue(b);
                });
                break;
            case Category.Tag:
            case Category.Company:
            case Category.Lists:
                subCategoryNodes = this.applyCompanySortingStrategy(subCategoryNodes);
                break;
            default:
                break;
        }
    }

    private applySortingStrategy(nodes: LeetCodeNode[]): LeetCodeNode[] {
        const strategy: SortingStrategy = getSortingStrategy();
        switch (strategy) {
            case SortingStrategy.AcceptanceRateAsc: return nodes.sort((x: LeetCodeNode, y: LeetCodeNode) => Number(x.acceptanceRate) - Number(y.acceptanceRate));
            case SortingStrategy.AcceptanceRateDesc: return nodes.sort((x: LeetCodeNode, y: LeetCodeNode) => Number(y.acceptanceRate) - Number(x.acceptanceRate));
            default: return nodes;
        }
    }

    private applyCompanySortingStrategy(nodes: LeetCodeNode[]): LeetCodeNode[] {
        const strategy: CompanySortingStrategy = getCompaniesSortingStrategy();
        switch (strategy) {
            case CompanySortingStrategy.Alphabetical: {
                return nodes.sort((a: LeetCodeNode, b: LeetCodeNode): number => {
                    if (a.name === 'Unknown') {
                        return 1;
                    }
                    if (b.name === 'Unknown') {
                        return -1;
                    }
                    return Number(a.name > b.name) - Number(a.name < b.name);
                });
            }
            case CompanySortingStrategy.Popularity: {
                const companyPopularityMapping = getCompanyPopularity();
                return nodes.sort(
                    (a: LeetCodeNode, b: LeetCodeNode): number => companyPopularityMapping[b.id] - companyPopularityMapping[a.id]
                );
            }
            default:
                return nodes;
        }
    }
}

export const explorerNodeManager: ExplorerNodeManager = new ExplorerNodeManager();
