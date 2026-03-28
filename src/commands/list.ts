// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { leetCodeChannel } from "../leetCodeChannel";
import { leetcodeClient } from "../leetCodeClient";
import { leetCodeManager } from "../leetCodeManager";
import { IProblem, UserStatus } from "../shared";
import { DialogType, promptForOpenOutputChannel } from "../utils/uiUtils";

export async function listProblems(): Promise<IProblem[]> {
    try {
        if (leetCodeManager.getStatus() === UserStatus.SignedOut) {
            return [];
        }
        return await leetcodeClient.listProblems();
    } catch (error) {
        await promptForOpenOutputChannel(
            "Failed to list problems. Please open the output channel for details.",
            DialogType.error,
        );
        leetCodeChannel.append(error);
        return [];
    }
}
