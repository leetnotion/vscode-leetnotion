import * as _ from "lodash";
import { Disposable } from "vscode";
import * as list from "../commands/list";
import { getSortingStrategy } from "../commands/plugin";
import { Category, CompanySortingStrategy, defaultProblem, ProblemRating, ProblemState, SortingStrategy } from "../shared";
import { getCompaniesSortingStrategy, shouldHideSolvedProblem } from "../utils/settingUtils";
import { LeetCodeNode } from "./LeetCodeNode";
import { globalState } from "../globalState";
import { getCompanyPopularity, getCompanyTags, getLists, getSheets, getTopicTags } from "../utils/dataUtils";
import { leetcodeClient } from "@/leetCodeClient";
import { LeetnotionTree } from "@/types";

class ExplorerNodeManager implements Disposable {
    private explorerNodeMap: Map<string, LeetCodeNode> = new Map<string, LeetCodeNode>();
    private dataTree: LeetnotionTree = {};

    public async refreshCache(): Promise<void> {
        this.dispose();
        const shouldHideSolved: boolean = shouldHideSolvedProblem();
        const dailyProblem = globalState.getDailyProblem();
        const ratingsMap = await leetcodeClient.getProblemRatingsMap();

        let problems = await list.listProblems()
        problems = problems.filter(item => !shouldHideSolved || item.state !== ProblemState.AC)

        const companyTags = getCompanyTags();
        const sheets = getSheets();
        const topicTags = await getTopicTags();

        for (const problem of problems) {
            const id = problem.id;
            if (ratingsMap[id]) {
                problem.rating = ratingsMap[id].Rating;
                problem.problemIndex = ratingsMap[id].ProblemIndex;
            }
            this.explorerNodeMap.set(problem.id, new LeetCodeNode(problem));
        }
        for (const company of Object.keys(companyTags)) {
            this.explorerNodeMap.set(`${Category.Company}.${company}`, new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: `${Category.Company}.${company}`,
                name: company
            }), false))
        }
        for (const tag of Object.keys(topicTags)) {
            this.explorerNodeMap.set(`${Category.Tag}.${tag}`, new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: `${Category.Tag}.${tag}`,
                name: tag
            }), false))
        }
        for (const sheet of Object.keys(sheets)) {
            this.explorerNodeMap.set(`${Category.Sheets}.${sheet}`, new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: `${Category.Sheets}.${sheet}`,
                name: sheet
            }), false))
        }

        const listsDetails: Record<string, string[]> = {};
        const lists = await getLists();
        if (lists) {
            for (const list of lists) {
                const questions = await globalState.getQuestionsOfList(list.slug);
                listsDetails[list.name] = questions.map(item => item.questionFrontendId);
                this.explorerNodeMap.set(`${Category.Lists}.${list.name}`, new LeetCodeNode(Object.assign({}, defaultProblem, {
                    id: `${Category.Lists}.${list.name}`,
                    name: list.name
                }), false))
            }
        }

        this.dataTree = {
            [Category.All]: problems.map(problem => problem.id),
            [Category.Difficulty]: {
                Easy: problems.filter(({ difficulty }) => difficulty === "Easy").map(problem => problem.id),
                Medium: problems.filter(({ difficulty }) => difficulty === "Medium").map(problem => problem.id),
                Hard: problems.filter(({ difficulty }) => difficulty === "Hard").map(problem => problem.id),
            },
            [Category.Tag]: topicTags,
            [Category.Company]: companyTags,
            [Category.Favorite]: problems.filter(({ isFavorite }) => isFavorite).map(problem => problem.id),
            [Category.Daily]: [dailyProblem],
            [Category.Sheets]: getSheets(),
            [Category.Lists]: listsDetails,
        }

        for (const category of Object.keys(this.dataTree)) {
            const node = new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: category,
                name: category
            }), false)
            this.explorerNodeMap.set(category, node);
        }
    }

    public getRootNodes(): LeetCodeNode[] {
        const nodes: LeetCodeNode[] = [];
        for (const category of Object.keys(this.dataTree)) {
            if(this.explorerNodeMap.has(category)) {
                const node = this.explorerNodeMap.get(category);
                nodes.push(node);
            }
        }
        return nodes;
    }

    public getNodeById(id: string): LeetCodeNode | undefined {
        return this.explorerNodeMap.get(id);
    }

    public getChildrenNodesById(id: string): LeetCodeNode[] {
        const data = this.getExplorerDataById(id);
        if (!data) {
            return []
        }
        if (Array.isArray(data)) {
            return this.applySortingStrategy(this.getProblemNodesByIds(data));
        } else {
            let res: LeetCodeNode[] = [];
            for (const key of Object.keys(data)) {
                if(this.explorerNodeMap.has(`${id}.${key}`)) {
                    const node = this.explorerNodeMap.get(`${id}.${key}`);
                    res.push(node);
                } else {
                    res.push(new LeetCodeNode(Object.assign({}, defaultProblem, {
                        id: `${id}.${key}`,
                        name: key,
                    }), false));
                }
            }
            res = this.applySortingStrategy(res, id);
            return res;
        }
    }

    public dispose(): void {
        this.explorerNodeMap.clear();
        this.dataTree = {};
    }

    public getParentNode(childId: string): LeetCodeNode | undefined {
        if(!childId || childId === "") {
            return undefined;
        }
        const meta = childId.split(".");
        if(meta.length === 2) {
            return this.explorerNodeMap.get(meta[0]);
        }
        return undefined;
    }

    public getExplorerDataById(id: string) {
        let data = this.dataTree;
        if (!id || id === "") {
            return data;
        }
        const metaInfo: string[] = id.split(".");
        for (const key of metaInfo) {
            if (data[key] === undefined) {
                return null;
            }
            data = data[key];
        }
        return data;
    }

    public getProblemNodesByIds(ids: string[]): LeetCodeNode[] {
        const res: LeetCodeNode[] = [];
        for (const id of ids) {
            const node = this.explorerNodeMap.get(id);
            if (node) {
                res.push(node);
            }
        }
        return res;
    }

    private applySortingStrategy(nodes: LeetCodeNode[], id?: string): LeetCodeNode[] {
        if (!id) {
            const strategy: SortingStrategy = getSortingStrategy();
            switch (strategy) {
                case SortingStrategy.AcceptanceRateAsc: return nodes.sort((x: LeetCodeNode, y: LeetCodeNode) => Number(x.acceptanceRate) - Number(y.acceptanceRate));
                case SortingStrategy.AcceptanceRateDesc: return nodes.sort((x: LeetCodeNode, y: LeetCodeNode) => Number(y.acceptanceRate) - Number(x.acceptanceRate));
                default: return nodes;
            }
        }
        if (id === Category.Company) {
            return this.applyCompanySortingStrategy(nodes);
        }
        if (id === Category.Tag || id === Category.Lists) {
            return nodes.sort((a: LeetCodeNode, b: LeetCodeNode) => a.name.localeCompare(b.name));
        }
        return nodes;
    }

    private applyCompanySortingStrategy(nodes: LeetCodeNode[]): LeetCodeNode[] {
        const strategy: CompanySortingStrategy = getCompaniesSortingStrategy();
        switch (strategy) {
            case CompanySortingStrategy.Alphabetical: {
                return nodes.sort((a: LeetCodeNode, b: LeetCodeNode): number => a.name.localeCompare(b.name));
            }
            case CompanySortingStrategy.Popularity: {
                const companyPopularityMapping = getCompanyPopularity();
                return nodes.sort((a: LeetCodeNode, b: LeetCodeNode): number => companyPopularityMapping[b.name] - companyPopularityMapping[a.name]);
            }
            default:
                return nodes;
        }
    }
}

export const explorerNodeManager: ExplorerNodeManager = new ExplorerNodeManager();
