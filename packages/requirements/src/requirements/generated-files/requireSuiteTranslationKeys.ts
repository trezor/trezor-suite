import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Requirement } from '../Requirement';

const TRANSLATION_KEYS_FILE_PATH = 'suite/intl/src/generated/translationKeys.ts';

const runTranslationKeysGenerator = (repoRoot: string) => {
    execFileSync('yarn', ['workspace', '@suite/intl', 'translations:generate-keys'], {
        cwd: repoRoot,
        stdio: 'pipe',
    });
};

const verifySuiteTranslationKeys = (repoRoot: string): ReadonlyArray<string> => {
    const translationKeysFilePath = join(repoRoot, TRANSLATION_KEYS_FILE_PATH);
    const previousContent = readFileSync(translationKeysFilePath, 'utf-8');

    runTranslationKeysGenerator(repoRoot);

    const currentContent = readFileSync(translationKeysFilePath, 'utf-8');

    if (currentContent === previousContent) {
        return [];
    }

    return [
        `${TRANSLATION_KEYS_FILE_PATH} is out of sync. Commit the result of "yarn workspace @suite/intl translations:generate-keys".`,
    ];
};

export const requireSuiteTranslationKeys: Requirement<'repo'> = {
    name: 'suite-translation-keys-generated',
    scope: 'repo',
    verify: ({ repoRoot }) => Promise.resolve(verifySuiteTranslationKeys(repoRoot)),
    fix: ({ repoRoot }) => {
        runTranslationKeysGenerator(repoRoot);

        return Promise.resolve(verifySuiteTranslationKeys(repoRoot));
    },
};
