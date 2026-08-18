import { type Baselines, type Limits } from '@trezor/perf-e2e';

/**
 * Both maps below are keyed by measurement: `'wallet-discovery [T3W1]'` applies to that scenario on
 * that device model only, while a bare `'wallet-discovery'` is the default for every model that has
 * no entry of its own. The entries here predate the per-model split, so they are still scenario-wide;
 * the end-of-run report prints per-model numbers to replace them with.
 */

/** What each scenario costs today, measured on CI. Reference only, never enforced. */
export const BASELINES: Baselines = {
    'wallet-discovery': {
        totalBlockingTimeMs: 453,
        longTaskCount: 18,
        longestTaskMs: 185,
        reactCommitCount: 270,
        interactionDurationMs: 7506,
    },
    'account-switch': {
        totalBlockingTimeMs: 217,
        longTaskCount: 1,
        longestTaskMs: 267,
        reactCommitCount: 43,
        interactionDurationMs: 915,
    },
    'multi-account-discovery': {
        totalBlockingTimeMs: 4700,
        longTaskCount: 62,
        longestTaskMs: 543,
        reactCommitCount: 237,
        interactionDurationMs: 12125,
    },
};

/** The highest value each metric may reach before it is reported as over limit. Raise deliberately. */
export const LIMITS: Limits = {
    'wallet-discovery': {
        totalBlockingTimeMs: 2000,
        longTaskCount: 45,
        longestTaskMs: 400,
        reactCommitCount: 410,
    },
    'account-switch': {
        totalBlockingTimeMs: 700,
        longTaskCount: 5,
        longestTaskMs: 700,
        reactCommitCount: 80,
    },
    'multi-account-discovery': {
        totalBlockingTimeMs: 7000,
        longTaskCount: 100,
        longestTaskMs: 800,
        reactCommitCount: 400,
    },
};
