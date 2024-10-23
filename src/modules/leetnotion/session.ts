import { window } from 'vscode';
import { globalState } from '../../globalState';
import { leetCodeChannel } from '../../leetCodeChannel';
import { IS_PROBLEMS_RETRIEVED, UPDATED_PAGES, LEETCODE_PROBLEMS } from '../../constants';
import { SessionDetails } from '../../types';

export class TemplateUpdateSession {

    currentSessionId: string | undefined;
    keys = [IS_PROBLEMS_RETRIEVED, UPDATED_PAGES, LEETCODE_PROBLEMS];

    public async init() {
        const pendingSessionDetails = globalState.getPendingSession();
        if (!pendingSessionDetails) {
            leetCodeChannel.appendLine('There is no pending session. So creating a new session');
            this.currentSessionId = this.createNewSession();
        } else {
            const option = await window.showQuickPick(['Continue', 'Restart'], {
                title: `You have a discontinued template update session`,
                canPickMany: false,
            });
            if (!option) {
                throw new Error(`Invalid option`);
            }
            if (option === 'Continue') {
                this.currentSessionId = pendingSessionDetails.id;
                leetCodeChannel.appendLine('There is a pending session. The pending session will be continued to update template.');
            } else {
                globalState.setPendingSession(undefined);
                for (const key of this.keys) {
                    globalState.update(`${pendingSessionDetails.id}.${key}`, undefined);
                }
                this.currentSessionId = this.createNewSession();
                leetCodeChannel.appendLine('Created a new update session');
            }
        }
    }

    private createNewSession() {
        const createdTime = new Date();
        const newSessionId = `session-${createdTime.getTime()}`;
        globalState.setPendingSession({
            id: newSessionId,
            createdTime
        })
        const newSession: SessionDetails = {
            [IS_PROBLEMS_RETRIEVED]: false,
            [LEETCODE_PROBLEMS]: [],
            [UPDATED_PAGES]: {},
        };
        for (const [key, value] of Object.entries(newSession)) {
            globalState.update(`${newSessionId}.${key}`, value);
        }
        leetCodeChannel.appendLine(`Created new session with session ID: ${newSessionId}`);
        return newSessionId;
    }

    get(property: string) {
        if (!this.currentSessionId) {
            throw new Error(`Session not initialized`);
        }
        return globalState.get(`${this.currentSessionId}.${property}`);
    }

    async update(property: string, value: unknown) {
        if (!this.currentSessionId) {
            throw new Error(`Session not initialized`);
        }
        await globalState.update(`${this.currentSessionId}.${property}`, value);
    }

    async append(property: string, value: unknown) {
        if (!this.currentSessionId) {
            throw new Error(`Session not initialized`);
        }
        let arr = this.get(property) as unknown[];
        if (!arr) {
            arr = [];
        }
        arr.push(value);
        await globalState.update(`${this.currentSessionId}.${property}`, arr);
    }

    async close() {
        globalState.setPendingSession(undefined);
        for (const key of this.keys) {
            this.update(key, undefined);
        }
    }
}

export const templateUpdateSession: TemplateUpdateSession = new TemplateUpdateSession();
