import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Requirement } from '../Requirement';

const TRANSLATION_KEYS_FILE_PATH = 'suite-native/intl/src/generated/translationKeys.ts';

const runTranslationKeysGenerator = (repoRoot: string) => {
    execFileSync('yarn', ['workspace', '@suite-native/intl', 'translations:generate-keys'], {
        cwd: repoRoot,
        stdio: 'pipe',
    });
};

const verifyNativeTranslationKeys = (repoRoot: string): ReadonlyArray<string> => {
    const translationKeysFilePath = join(repoRoot, TRANSLATION_KEYS_FILE_PATH);
    const previousContent = readFileSync(translationKeysFilePath, 'utf-8');

    runTranslationKeysGenerator(repoRoot);

    const currentContent = readFileSync(translationKeysFilePath, 'utf-8');

    if (currentContent === previousContent) {
        return [];
    }

    return [
        `${TRANSLATION_KEYS_FILE_PATH} is out of sync. Commit the result of "yarn workspace @suite-native/intl translations:generate-keys".`,
    ];
};

export const requireNativeTranslationKeys: Requirement<'repo'> = {
    name: 'native-translation-keys-generated',
    scope: 'repo',
    verify: ({ repoRoot }) => Promise.resolve(verifyNativeTranslationKeys(repoRoot)),
    fix: ({ repoRoot }) => {
        runTranslationKeysGenerator(repoRoot);

        return Promise.resolve(verifyNativeTranslationKeys(repoRoot));
    },
};
