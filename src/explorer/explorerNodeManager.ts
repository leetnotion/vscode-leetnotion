import * as _ from "lodash";
import { Disposable } from "vscode";
import * as list from "../commands/list";
import { getSortingStrategy } from "../commands/plugin";
import { Category, CompanySortingStrategy, defaultProblem, ProblemRating, ProblemState, SortingStrategy } from "../shared";
import { getCompaniesSortingStrategy, shouldHideSolvedProblem } from "../utils/settingUtils";
import { LeetCodeNode } from "./LeetCodeNode";
import { globalState } from "../globalState";
import { getCompanyPopularity, getCompanyTags, getLists, getSheets } from "../utils/dataUtils";
import { leetcodeClient } from "@/leetCodeClient";
import { LeetnotionTree } from "@/types";
import { leetCodeChannel } from "@/leetCodeChannel";

class ExplorerNodeManager implements Disposable {
    private explorerNodeMap: Map<string, LeetCodeNode> = new Map<string, LeetCodeNode>();
    private dataTree: LeetnotionTree = {};

    public async refreshCache(): Promise<void> {
        this.dispose();
        const shouldHideSolved: boolean = shouldHideSolvedProblem();
        const dailyProblem = globalState.getDailyProblem();
        const ratingsMap = await leetcodeClient.getProblemRatingsMap();

        let problems = await list.listProblems()
        // problems = problems.filter(item => shouldHideSolved && item.state !== ProblemState.AC)

        const tagProblems = {};
        for (const problem of problems) {
            const id = problem.id;
            if (ratingsMap[id]) {
                problem.rating = ratingsMap[id].Rating;
                problem.problemIndex = ratingsMap[id].ProblemIndex;
            }
            this.explorerNodeMap.set(problem.id, new LeetCodeNode(problem));
            const tags = problem.tags;
            for (const tag of tags) {
                if (tagProblems[tag]) {
                    tagProblems[tag].push(problem.id);
                } else {
                    tagProblems[tag] = [problem.id];
                }
            }
        }

        const listsDetails: Record<string, string[]> = {};
        const lists = await getLists();
        if (lists) {
            for (const list of lists) {
                const questions = await globalState.getQuestionsOfList(list.slug);
                listsDetails[list.name] = questions.map(item => item.questionFrontendId);
            }
        }

        this.dataTree = {
            [Category.All]: problems.map(problem => problem.id),
            [Category.Difficulty]: {
                Easy: problems.filter(({ difficulty }) => difficulty === "Easy").map(problem => problem.id),
                Medium: problems.filter(({ difficulty }) => difficulty === "Medium").map(problem => problem.id),
                Hard: problems.filter(({ difficulty }) => difficulty === "Hard").map(problem => problem.id),
            },
            [Category.Tag]: tagProblems,
            [Category.Company]: getCompanyTags(),
            [Category.Favorite]: problems.filter(({ isFavorite }) => isFavorite).map(problem => problem.id),
            [Category.Daily]: [dailyProblem],
            [Category.Sheets]: getSheets(),
            [Category.Lists]: listsDetails,
        }
    }

    public getRootNodes(): LeetCodeNode[] {
        const nodes: LeetCodeNode[] = [];
        for (const category of Object.keys(this.dataTree)) {
            nodes.push(
                new LeetCodeNode(Object.assign({}, defaultProblem, {
                    id: category,
                    name: category
                }), false)
            )
        }
        leetCodeChannel.appendLine(`ExplorerNodeManager: getRootNodes: ${JSON.stringify(nodes)}`);
        return nodes;
    }

    public getNodeById(id: string): LeetCodeNode | undefined {
        return this.explorerNodeMap.get(id);
    }

    public getChildrenNodesById(id: string): LeetCodeNode[] {
        const metaInfo: string[] = id.split(".");
        let data = this.dataTree;
        for(const key of metaInfo) {
            if (data[key] === undefined) {
                return [];
            }
            data = data[key];
        }
        if (Array.isArray(data)) {
            return this.getProblemNodesByIds(data);
        } else {
            const res: LeetCodeNode[] = [];
            for (const key of Object.keys(data)) {
                res.push(new LeetCodeNode(Object.assign({}, defaultProblem, {
                    id: `${id}.${key}`,
                    name: key,
                }), false));
            }
            this.sortSubCategoryNodes(res, metaInfo[0] as Category);
            return res;
        }
    }

    public dispose(): void {
        this.explorerNodeMap.clear();
        this.dataTree = {};
    }

    private getProblemNodesByIds(ids: string[]): LeetCodeNode[] {
        const res: LeetCodeNode[] = [];
        for (const id of ids) {
            const node = this.explorerNodeMap.get(id);
            if (node) {
                res.push(node);
            }
        }
        return this.applySortingStrategy(res);
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
