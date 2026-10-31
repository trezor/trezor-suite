import { Model } from '@trezor/trezor-user-env-link';

const TESTS_DIR = 'suite/e2e/tests/';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Regex fragment matching any test file the PR edited (E2E_EDITED_SPECS, set by CI), or undefined when none.
const getEditedSpecsPattern = (): string | undefined => {
    const editedSpecs = (process.env.E2E_EDITED_SPECS ?? '')
        .split(',')
        .filter(Boolean)
        .map(spec => escapeRegExp(spec.replace(TESTS_DIR, '')));

    return editedSpecs.length ? `(?:${editedSpecs.join('|')})` : undefined;
};

// Grep-invert pattern: excludes tests matching the condition unless the PR edited their file.
const excludeUnlessEdited = (condition: string): RegExp => {
    const editedSpecsPattern = getEditedSpecsPattern();

    return new RegExp(`^${condition}${editedSpecsPattern ? `(?!.*${editedSpecsPattern})` : ''}`);
};

/**
 * Tags that keep a test out of the full PR run. `@skipOnPR` never runs on a PR. `@optional`
 * runs on a PR only when the PR edits the test's file (E2E_EDITED_SPECS, set by CI) or an LLM
 * test selector targets it.
 */
export const excludedFromFullPrRun = (): RegExp[] => [
    /@skipOnPR/,
    excludeUnlessEdited('(?=.*@optional)'),
];

/** Web full PR run: only @webOnly tests, unless the PR edited the test's file. */
export const notWebOnlyUnlessEdited = (): RegExp => excludeUnlessEdited('(?!.*@webOnly)');

/** T3T1 full PR run: only tests no other model shares, unless the PR edited the test's file. */
export const sharedWithOtherModelUnlessEdited = (): RegExp => {
    const otherModels = Object.values(Model).filter(model => model !== Model.T3T1);

    return excludeUnlessEdited(`(?=.*@(?:${otherModels.join('|')}))`);
};
