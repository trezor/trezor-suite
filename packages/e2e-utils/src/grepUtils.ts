import { Model } from '@trezor/trezor-user-env-link';

/**
 * Returns a regex fragment of negative lookaheads for every device model except T3T1.
 * Combine with a positive T3T1 assertion to detect tests that are T3T1-only
 * (i.e. not shared with any other device model).
 * The caller is responsible for anchoring the resulting regex (e.g. prefixing with `^`).
 */
export function noOtherDevice(): string {
    return Object.values(Model)
        .filter(m => m !== Model.T3T1)
        .map(m => `(?!.*@${m})`)
        .join('');
}
