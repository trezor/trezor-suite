import type { PerfRunIdentity } from './publishRuns';
import type { PerfRun, PerfSurface } from './store';
import type { PerfMetrics } from './types';

/**
 * The history document the browser surfaces (web and desktop) leave behind, and its mapping into
 * the shared envelope. It lives here rather than in the Playwright harness so the shape that is
 * persisted — and the metric namespace it lands under — is part of the store's contract and can be
 * tested without a browser.
 */

export type PerfHistoryMeasurement = {
    scenario: string;
    /** The Playwright project, i.e. the device model the scenario was measured against. */
    variant: string;
    /** How many samples the median came from — a retry is another sample of the same measurement. */
    runs: number;
    metrics: Partial<PerfMetrics>;
};

export type PerfHistoryFile = {
    generatedAt: string;
    surface: PerfSurface;
    measurements: PerfHistoryMeasurement[];
};

/**
 * Namespaced by the instrument rather than the surface: these come from our own in-page
 * instrumentation, which also runs inside Electron. Lighthouse audits arrive under `lh:` and must
 * never be compared against these.
 */
export const BROWSER_METRIC_PREFIX = 'browser';

/** The artifact every measurement of a shard drills into. */
const ARTIFACT_NAME = 'history';

const SURFACES: Record<string, PerfSurface> = { web: 'web', desktop: 'desktop' };

/** Only `web` and `desktop` are measured here; anything else cannot be filed under a surface. */
export const resolveSurface = (target: string | undefined): PerfSurface | null =>
    (target && SURFACES[target]) || null;

export const buildHistoryFile = (
    surface: PerfSurface,
    measurements: readonly PerfHistoryMeasurement[],
    generatedAt = new Date().toISOString(),
): PerfHistoryFile => ({ generatedAt, surface, measurements: [...measurements] });

/** A shard that measured nothing contributes no run, rather than an empty one. */
export const historyToPerfRun = (
    shard: string,
    history: PerfHistoryFile,
    identity: PerfRunIdentity,
): PerfRun | null => {
    if (history.measurements.length === 0) {
        return null;
    }

    return {
        context: {
            ...identity,
            surface: history.surface,
            shard,
            generatedAt: history.generatedAt,
        },
        artifacts: [
            {
                kind: 'browser-report',
                name: ARTIFACT_NAME,
                body: `${JSON.stringify(history, null, 2)}\n`,
            },
        ],
        measurements: history.measurements.map(measurement => ({
            scenario: measurement.scenario,
            variant: measurement.variant,
            samples: measurement.runs,
            metrics: Object.fromEntries(
                Object.entries(measurement.metrics).map(([key, value]) => [
                    `${BROWSER_METRIC_PREFIX}:${key}`,
                    value ?? null,
                ]),
            ),
            artifact: ARTIFACT_NAME,
        })),
    };
};
