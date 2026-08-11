import { type Baselines, type Limits } from '@trezor/perf-e2e';

/** What each scenario costs today, measured on CI. Reference only, never enforced. */
export const BASELINES: Baselines = {
    'wallet-discovery': {
        totalBlockingTimeMs: 1424,
        longTaskCount: 28,
        longestTaskMs: 234,
        reactCommitCount: 161,
        interactionDurationMs: 6544,
    },
    'account-switch': {
        totalBlockingTimeMs: 398,
        longTaskCount: 2,
        longestTaskMs: 440,
        reactCommitCount: 40,
        interactionDurationMs: 1344,
    },
    'multi-account-discovery': {
        totalBlockingTimeMs: 4700,
        longTaskCount: 62,
        longestTaskMs: 543,
        reactCommitCount: 237,
        interactionDurationMs: 12125,
    },
};

/** The highest value each metric may reach before the run fails. Raise deliberately. */
export const LIMITS: Limits = {
    'wallet-discovery': {
        totalBlockingTimeMs: 2000,
        longTaskCount: 45,
        longestTaskMs: 400,
        reactCommitCount: 260,
    },
    'account-switch': {
        // TEMPORARY: deliberately impossible, to prove CI fails on a breach. Revert before merge.
        totalBlockingTimeMs: 1,
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
