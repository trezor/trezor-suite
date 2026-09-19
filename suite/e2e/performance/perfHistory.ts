import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import type { PerfHistoryFile } from '@trezor/perf-e2e';

/**
 * Written only when CI asks for it by naming a directory, so a local run leaves no stray file.
 * Failing to write it is reported and swallowed: the history is never worth failing a test run over.
 * The document's shape and its mapping into the store live in `@trezor/perf-e2e`.
 *
 * Its own directory, never Playwright's `test-results`: that belongs to the test runner, which
 * cleans it when it sees fit — a file left there does not survive to the upload step. The name is
 * unique per process because an orchestrated run reports in batches, and a fixed name would leave
 * only the last batch's numbers.
 */
export const writeHistoryFile = (
    file: PerfHistoryFile,
    directory: string | undefined,
    log: (message: string) => void,
): void => {
    if (!directory) {
        return;
    }

    const filePath = join(directory, `perf-history-${Date.now()}-${process.pid}.json`);

    try {
        mkdirSync(directory, { recursive: true });
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
