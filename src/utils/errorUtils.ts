import { leetCodeChannel } from '../leetCodeChannel';
import { DialogType, promptForOpenOutputChannel } from './uiUtils';

export interface HandleErrorOptions {
	/** Whether to show a user-facing dialog. Default: true */
	showDialog?: boolean;
	/** Dialog severity. Default: DialogType.error */
	dialogType?: DialogType;
}

/**
 * Extracts a human-readable message from an unknown error value.
 */
function extractErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === 'string') {
		return error;
	}
	return String(error);
}

/**
 * Centralized error handler for user-facing operations.
 *
 * Logs the error to the output channel and optionally shows a dialog
 * prompting the user to open it.
 *
 * @param error - The caught error value.
 * @param context - What failed, e.g. "submit the solution". Used in both
 *   the log line and the user-facing message.
 * @param options - Override dialog visibility or severity.
 */
export async function handleError(
	error: unknown,
	context: string,
	options?: HandleErrorOptions,
): Promise<void> {
	const message = extractErrorMessage(error);
	const showDialog = options?.showDialog ?? true;
	const dialogType = options?.dialogType ?? DialogType.error;

	leetCodeChannel.appendLine(`[Error] Failed to ${context}: ${message}`);

	if (showDialog) {
		await promptForOpenOutputChannel(
			`Failed to ${context}. Please open the output channel for details.`,
			dialogType,
		);
	}
}

/**
 * Error handler for background/recurring tasks.
 *
 * Logs to the output channel only — no user-facing dialog, since background
 * failures shouldn't interrupt the user.
 */
export function handleBackgroundError(error: unknown, context: string): void {
	const message = extractErrorMessage(error);
	leetCodeChannel.appendLine(`[Background] Failed to ${context}: ${message}`);
}
