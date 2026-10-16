import { execFileSync } from 'child_process';

import { getGrepArgsForTranslationKeys } from '@suite-common/suite-utils';

// Runs a single grep pass over `cwd` and returns the subset of `keys` that are
// actually used in the scanned source. One pass instead of one grep per key: the
// per-key approach rescanned the whole repo 2500+ times, taking minutes vs ~1s.
export const findUsedTranslationKeys = (keys: string[], cwd: string): Set<string> => {
    let stdout: string;
    try {
        stdout = execFileSync('grep', getGrepArgsForTranslationKeys(), {
            cwd,
            input: keys.join('\n'),
            encoding: 'utf-8',
            maxBuffer: 256 * 1024 * 1024,
        });
    } catch (error) {
        // grep exits with status 1 when there are no matches at all – that means
        // every key is unused, not a failure. Anything else is a real error.
        const { status, stdout: out } = error as { status?: number; stdout?: string };
        if (status !== 1 || typeof out !== 'string') throw error;
        stdout = out;
    }

    return new Set(stdout.split('\n').filter(Boolean));
};
