import type { Baselines, Limits, TimingMetricKey } from './types';

/** Readable names for the persisted metric keys. */
const metric = {
    timeToFirstFrame: 'ttffMs',
    timeToInteractive: 'ttiMs',
    firstInputDelay: 'fidMs',
} as const satisfies Record<string, TimingMetricKey>;

/**
 * What each screen costs today, measured on CI. Reference only, never enforced.
 *
 * Empty until a run has recorded real numbers — the end-of-run table prints the block to paste here.
 */
export const BASELINES: Baselines = {};

/**
 * The highest value each metric may reach before it is reported as over limit. Raise deliberately.
 *
 * These are react-native-lighthouse's own "poor" boundaries (TTFF 800 ms, TTI 1500 ms, FID 150 ms),
 * not numbers measured on our emulators — the library calls anything below them good or acceptable.
 * Every screen starts from the same set; split them once a screen measurably differs.
 *
 * The Lighthouse score is deliberately absent: it is better when higher, so a ceiling would report
 * it backwards. It is reported next to the timings that do carry limits.
 */
export const LIMITS: Limits = {
    home: {
        [metric.timeToFirstFrame]: 800,
        [metric.timeToInteractive]: 1500,
        [metric.firstInputDelay]: 150,
    },
    accounts: {
        [metric.timeToFirstFrame]: 800,
        [metric.timeToInteractive]: 1500,
        [metric.firstInputDelay]: 150,
    },
    'account-detail': {
        [metric.timeToFirstFrame]: 800,
        [metric.timeToInteractive]: 1500,
        [metric.firstInputDelay]: 150,
    },
    send: {
        [metric.timeToFirstFrame]: 800,
        [metric.timeToInteractive]: 1500,
        [metric.firstInputDelay]: 150,
    },
    receive: {
        [metric.timeToFirstFrame]: 800,
        [metric.timeToInteractive]: 1500,
        [metric.firstInputDelay]: 150,
    },
};
