// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { leetcodeClient } from "../leetCodeClient";
import { DialogType, promptForOpenOutputChannel } from "../utils/uiUtils";

export async function deleteCache(): Promise<void> {
    try {
        await leetcodeClient.deleteCache();
    } catch (error) {
        await promptForOpenOutputChannel(
            "Failed to delete cache. Please open the output channel for details.",
            DialogType.error,
        );
    }
}
