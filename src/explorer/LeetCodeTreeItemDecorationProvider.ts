import { URLSearchParams } from 'url';
import {
	Disposable,
	EventEmitter,
	FileDecoration,
	FileDecorationProvider,
	ProviderResult,
	ThemeColor,
	Uri,
	workspace,
	WorkspaceConfiguration,
} from 'vscode';
import { explorerNodeManager } from './explorerNodeManager';

export class LeetCodeTreeItemDecorationProvider implements FileDecorationProvider, Disposable {
	private readonly _onDidChangeFileDecorations = new EventEmitter<Uri | Uri[] | undefined>();
	public readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

	private readonly configListener = workspace.onDidChangeConfiguration((e) => {
		if (
			e.affectsConfiguration('leetnotion.showFolderEmojis') ||
			e.affectsConfiguration('leetnotion.colorizeProblems')
		) {
			this._onDidChangeFileDecorations.fire(undefined);
		}
	});

	public dispose(): void {
		this._onDidChangeFileDecorations.dispose();
		this.configListener.dispose();
	}
	private readonly DIFFICULTY_BADGE_LABEL: { [key: string]: string } = {
		easy: 'E',
		medium: 'M',
		hard: 'H',
	};

	private readonly FOLDER_BADGE: { [key: string]: string } = {
		// Add custom folder emojis here, keyed by folder name (last segment of node ID)
		All: '👑',
		Difficulty: '🏆',
		'Difficulty#Easy': '🤓',
		'Difficulty#Medium': '😳',
		'Difficulty#Hard': '🫪',
		Tag: '🏷️',
		Company: '🏢',
		Favorite: '💝',
		Daily: '📅',
		Sheets: '📋',
		Lists: '📝',
		Contests: '⚔️',
		// Sheets — achievement reactions
		'Sheets#LeetCode 75': '⭐',
		'Sheets#Programming Skills': '🛠️',
		'Sheets#Binary Search': '⚡',
		'Sheets#SQL 50': '🗃️',
		'Sheets#Blind 75': '🔥',
		'Sheets#Top Interview 150': '🎯',
		'Sheets#Top 100 Liked': '❤️‍🔥',
		'Sheets#Neetcode 150': '💪',
		'Sheets#Grokking Coding Interview Patterns': '🧩',
		'Sheets#Premium Algo 100': '💎',
		'Sheets#Advanced SQL 50': '🏛️',
		'Sheets#Graph Theory': '🕸️',
		'Sheets#Dynamic Programming': '🤯',
		'Sheets#Neetcode 250': '🧠',
		'Sheets#Dynamic Programming Grandmaster': '🐉',
		'Sheets#Neetcode All': '🏆',
	};

	private readonly ITEM_COLOR: { [key: string]: ThemeColor } = {
		easy: new ThemeColor('charts.green'),
		medium: new ThemeColor('charts.yellow'),
		hard: new ThemeColor('charts.red'),
	};

	public provideFileDecoration(uri: Uri): ProviderResult<FileDecoration> {
		if (uri.scheme !== 'leetcode') {
			return;
		}

		if (uri.authority === 'tree-node') {
			if (!this.isFolderEmojiEnabled()) {
				return;
			}
			const nodeId = decodeURIComponent(uri.path.slice(1));
			if (explorerNodeManager.isFolderCompleted(nodeId)) {
				const badge = this.FOLDER_BADGE[nodeId] ?? '✅';
				return { badge };
			}
			return;
		}

		if (uri.authority !== 'problems' || !this.isDifficultyBadgeEnabled()) {
			return;
		}

		const params: URLSearchParams = new URLSearchParams(uri.query);
		const difficulty: string = params.get('difficulty')!.toLowerCase();
		return {
			badge: this.DIFFICULTY_BADGE_LABEL[difficulty],
			color: this.ITEM_COLOR[difficulty],
		};
	}

	private isDifficultyBadgeEnabled(): boolean {
		const configuration: WorkspaceConfiguration = workspace.getConfiguration();
		return configuration.get<boolean>('leetnotion.colorizeProblems', false);
	}

	private isFolderEmojiEnabled(): boolean {
		const configuration: WorkspaceConfiguration = workspace.getConfiguration();
		return configuration.get<boolean>('leetnotion.showFolderEmojis', true);
	}
}

export const leetCodeTreeItemDecorationProvider: LeetCodeTreeItemDecorationProvider =
	new LeetCodeTreeItemDecorationProvider();
