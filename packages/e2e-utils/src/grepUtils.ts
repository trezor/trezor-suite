import { Model } from '@trezor/trezor-user-env-link';

const TESTS_DIR = 'suite/e2e/tests/';

/**
 * Tags that keep a test out of the full PR run. `@nightlyOnly` never runs on a PR. `@optional`
 * runs on a PR only when the PR edits the test's file (E2E_EDITED_SPECS, set by CI) or a LLM
 * test selector targets it.
 */
export const excludedFromFullPrRun = (): RegExp[] => {
    const editedSpecs = (process.env.E2E_EDITED_SPECS ?? '')
        .split(',')
        .filter(Boolean)
        .map(spec => spec.replace(TESTS_DIR, ''));
    const notEditedOptionalSpecs = editedSpecs.length
        ? new RegExp(`^(?!.*(?:${editedSpecs.join('|')})).*@optional`)
        : /@optional/;

    return [/@nightlyOnly/, notEditedOptionalSpecs];
};

/**
 * Returns a regex fragment of negative lookaheads for every device model except T3T1.
 * Combine with a positive T3T1 assertion to select tests that are T3T1-only
 * (i.e. not shared with any other device model). Used by the PR configs so that the
 * T3T1 project runs only its exclusive tests — shared T3W1/T3T1 tests are covered by
 * the representative T3W1 project on PR and by the full nightly run.
 * The caller is responsible for anchoring the resulting regex (e.g. prefixing with `^`).
 */
export function noOtherDevice(): string {
    return Object.values(Model)
        .filter(m => m !== Model.T3T1)
        .map(m => `(?!.*@${m})`)
        .join('');
}
