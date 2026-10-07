import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import type { FlowDocument, PerfHistoryFile } from '@trezor/perf-e2e';

/**
 * Written only when CI asks for it by naming a directory, so a local run leaves no stray file.
 * Failing to write is reported and swallowed: neither document is worth failing a test run over.
 * Their shapes, and their mapping into the store, live in `@trezor/perf-e2e`.
 *
 * Their own directory, never Playwright's `test-results`: that belongs to the test runner, which
 * cleans it when it sees fit — a file left there does not survive to the upload step. Names are
 * unique per writer because an orchestrated run reports in batches and a test may retry, and a
 * fixed name would leave only the last of them.
 */
const write = (
    directory: string | undefined,
    fileName: string,
    contents: unknown,
    describe: (filePath: string) => string,
    log: (message: string) => void,
): void => {
    if (!directory) {
        return;
    }

    const filePath = join(directory, fileName);

    try {
        mkdirSync(directory, { recursive: true });
        writeFileSync(filePath, `${JSON.stringify(contents, null, 2)}\n`);
        log(describe(filePath));
    } catch (error) {
        log(
            `[performance] Could not write ${fileName}: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
};

export const writeHistoryFile = (
    file: PerfHistoryFile,
    directory: string | undefined,
    log: (message: string) => void,
): void =>
    write(
        directory,
        `perf-history-${Date.now()}-${process.pid}.json`,
        file,
        filePath =>
            `[performance] History written to ${filePath} (${file.measurements.length} measurement(s)).`,
        log,
    );

/** One per profiled test: the test's own retry keeps a re-run from overwriting the attempt before. */
export const writeFlowDocument = (
    document: FlowDocument,
    directory: string | undefined,
    log: (message: string) => void,
): void =>
    write(
        directory,
        `perf-flow-${Date.now()}-${process.pid}-${document.retry}.json`,
        document,
        filePath =>
            `[performance] Lighthouse flow written to ${filePath} (${document.steps.length} step(s)).`,
        log,
    );
