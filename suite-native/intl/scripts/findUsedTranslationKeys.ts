import { execFileSync } from 'child_process';

import { getGrepArgsForTranslationKeys } from '@suite-common/suite-utils';

const processStdOut = (stdout: string) => new Set(stdout.split('\n').filter(Boolean));

// Runs a single grep pass over `cwd` and returns the subset of `keys` that are
// actually used in the scanned source. Keys are passed to grep via stdin as fixed
// strings and grep is spawned without a shell, so keys are never interpreted by
// a shell nor as regular expressions (they come from messages.ts, which the
// Crowdin sync rewrites from downloaded en-US.json).
export const findUsedTranslationKeys = (keys: string[], cwd: string): Set<string> => {
    try {
        const stdout = execFileSync('grep', getGrepArgsForTranslationKeys(), {
            cwd,
            input: keys.join('\n'),
            encoding: 'utf-8',
            maxBuffer: 256 * 1024 * 1024,
        });

        return processStdOut(stdout);
    } catch (error: unknown) {
        // grep exits with status 1 when there are no matches at all – that means
        // every key is unused, not a failure. Anything else is a real error.
        if (
            typeof error !== 'object' ||
            error === null ||
            !('status' in error) ||
            error.status !== 1 ||
            !('stdout' in error) ||
            typeof error.stdout !== 'string'
        ) {
            throw error;
        }

        return processStdOut(error.stdout);
    }
};
