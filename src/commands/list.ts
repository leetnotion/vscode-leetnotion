import { leetcodeClient } from '../leetCodeClient';
import { leetCodeManager } from '../leetCodeManager';
import { IProblem, UserStatus } from '../shared';
import { handleError } from '../utils/errorUtils';

export async function listProblems(): Promise<IProblem[]> {
	try {
		if (leetCodeManager.getStatus() === UserStatus.SignedOut) {
			return [];
		}
		return await leetcodeClient.listProblems();
	} catch (error) {
		await handleError(error, 'list problems');
		return [];
	}
}
