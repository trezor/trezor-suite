import { type Baselines, type Limits } from '@trezor/perf-e2e';

/**
 * Both maps below are keyed by measurement: `'wallet-discovery [T3W1]'` applies to that scenario on
 * that device model only, while a bare `'wallet-discovery'` is the default for every model that has
 * no entry of its own. The entries here are still scenario-wide; the end-of-run report prints
 * per-model numbers to split them with once a scenario measurably differs between models.
 */

/** What each scenario costs today, measured on CI. Reference only, never enforced. */
export const BASELINES: Baselines = {
    'wallet-discovery': {
        totalBlockingTimeMs: 894,
        longTaskCount: 26,
        longestTaskMs: 196,
        reactCommitCount: 214,
        interactionDurationMs: 6894,
    },
    'account-switch': {
        totalBlockingTimeMs: 282,
        longTaskCount: 1,
        longestTaskMs: 332,
        reactCommitCount: 35,
        interactionDurationMs: 696,
    },
    'multi-account-discovery': {
        totalBlockingTimeMs: 2063,
        longTaskCount: 55,
        longestTaskMs: 333,
        reactCommitCount: 231,
        interactionDurationMs: 8369,
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
