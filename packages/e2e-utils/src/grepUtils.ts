import { Model } from '@trezor/trezor-user-env-link';

/**
 * Tags that keep a test out of the full PR run. `@nightlyOnly` never runs on a PR; `@optional`
 * runs on a PR only when a spec list (LLM test selector or an edited test file) targets it.
 */
export const excludedFromFullPrRun = /@nightlyOnly|@optional/;

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
