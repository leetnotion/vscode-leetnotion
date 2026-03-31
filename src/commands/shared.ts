import { leetCodeManager } from '../leetCodeManager';
import { promptForSignIn } from '../utils/uiUtils';

/**
 * Wraps a command handler with an authentication check.
 *
 * If the user is not signed in, prompts them to sign in and skips the handler.
 * Otherwise, runs the handler with the provided arguments.
 */
export function withAuth<T extends (...args: any[]) => any>(
	handler: T,
): (...args: Parameters<T>) => Promise<void> {
	return async (...args: Parameters<T>): Promise<void> => {
		if (!leetCodeManager.getUser()) {
			promptForSignIn();
			return;
		}
		await handler(...args);
	};
}
