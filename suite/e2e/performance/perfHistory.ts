import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';

import type { PerfHistoryFile } from '@trezor/perf-e2e';

/**
 * Written only when CI asks for it by naming a path, so a local run leaves no stray file. Failing
 * to write it is reported and swallowed: the history is never worth failing a test run over. The
 * document's shape and its mapping into the store live in `@trezor/perf-e2e`.
 */
export const writeHistoryFile = (
    file: PerfHistoryFile,
    filePath: string | undefined,
    log: (message: string) => void,
): void => {
    if (!filePath) {
        return;
    }

    try {
        mkdirSync(dirname(filePath), { recursive: true });
        writeFileSync(filePath, `${JSON.stringify(file, null, 2)}\n`);
        log(
            `[performance] History written to ${filePath} (${file.measurements.length} measurement(s)).`,
        );
    } catch (error) {
        log(
            `[performance] Could not write the history file: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
};
