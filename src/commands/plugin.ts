import * as vscode from 'vscode';
import { leetCodeTreeDataProvider } from '../explorer/LeetCodeTreeDataProvider';
import { IQuickItemEx, SortingStrategy } from '../shared';

const SORT_ORDER: SortingStrategy[] = [
	SortingStrategy.None,
	SortingStrategy.AcceptanceRateAsc,
	SortingStrategy.AcceptanceRateDesc,
];

export async function switchSortingStrategy(): Promise<void> {
	const currentStrategy: SortingStrategy = getSortingStrategy();
	const picks: Array<IQuickItemEx<string>> = [];
	picks.push(
		...SORT_ORDER.map((s: SortingStrategy) => {
			return {
				label: `${currentStrategy === s ? '$(check)' : '    '} ${s}`,
				value: s,
			};
		}),
	);

	const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(picks);
	if (!choice || choice.value === currentStrategy) {
		return;
	}

	const leetCodeConfig: vscode.WorkspaceConfiguration =
		vscode.workspace.getConfiguration('leetnotion');
	await leetCodeConfig.update('problems.sortStrategy', choice.value, true);
	await leetCodeTreeDataProvider.refresh();
}

export function getSortingStrategy(): SortingStrategy {
	const leetCodeConfig: vscode.WorkspaceConfiguration =
		vscode.workspace.getConfiguration('leetnotion');
	return leetCodeConfig.get<SortingStrategy>('problems.sortStrategy', SortingStrategy.None);
}
