import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { createLogger } from '../logger';

const logger = createLogger('fixBot');

export const ANALYZE_ERRORS_FILE = 'packages/e2e-utils/src/fixBot/reports/errors.txt';
export const fixErrorsFile = (taskId: string) => `fixbot-errors-${taskId}.txt`;

/** A fix job identifies itself by TASK_ID; the analyze job writes into its report dir. */
function errorsFilePath(): string {
    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
        encoding: 'utf-8',
    }).trim();
    const taskId = process.env.TASK_ID;

    return join(root, taskId ? fixErrorsFile(taskId) : ANALYZE_ERRORS_FILE);
}

/**
 * Channel for problems the harness cannot throw on. The call site passes the message humans
 * should read in the nightly Slack notification and logs the original error itself, so the
 * stack stays in the CI log and never reaches Slack.
 */
export function reportToSlack(message: string): void {
    logger.error(message);

    try {
        const path = errorsFilePath();
        mkdirSync(dirname(path), { recursive: true });
        appendFileSync(path, `${message}\n`);
    } catch (e) {
        logger.warn(`[errors] could not record the message: ${(e as Error).message}`);
    }
}

export function readErrors(path: string | undefined): string[] {
    if (!path || !existsSync(path)) return [];

    try {
        return readFileSync(path, 'utf-8').split('\n').filter(Boolean);
    } catch (e) {
        logger.warn(`[errors] could not read ${path}: ${(e as Error).message}`);

        return [];
    }
}

/** Per-task errors from a directory of downloaded `fixbot-errors-<taskId>.txt` files. */
export function readTaskErrors(dir: string | undefined): Record<string, string[]> {
    if (!dir || !existsSync(dir)) return {};

    const byTaskId: Record<string, string[]> = {};

    for (const filename of readdirSync(dir)) {
        const taskId = /^fixbot-errors-(.+)\.txt$/.exec(filename)?.[1];
        if (!taskId) continue;

        const errors = readErrors(join(dir, filename));
        if (errors.length > 0) byTaskId[taskId] = errors;
    }

    return byTaskId;
}
