import type { FlowDocument } from './lighthouseFlow';
import { flowArtifactName } from './lighthouseFlow';
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

/**
 * A shard may write more than one document — the run is orchestrated in batches, and each Playwright
 * process reports its own. They are merged on read: a scenario measured twice keeps the later
 * numbers, which are the ones that ran last.
 */
export const mergeHistories = (files: readonly PerfHistoryFile[]): PerfHistoryFile | null => {
    const [first] = files;

    if (!first) {
        return null;
    }

    const byMeasurement = new Map<string, PerfHistoryMeasurement>();

    for (const file of files) {
        for (const measurement of file.measurements) {
            byMeasurement.set(`${measurement.scenario}\u0000${measurement.variant}`, measurement);
        }
    }

    return {
        // The newest stamp: the document describes the run, and the run ended when the last one did.
        generatedAt:
            files
                .map(file => file.generatedAt)
                .toSorted()
                .at(-1) ?? first.generatedAt,
        surface: first.surface,
        measurements: [...byMeasurement.values()],
    };
};

const measurementKey = (scenario: string, variant: string | undefined) =>
    `${scenario}\u0000${variant ?? ''}`;

/**
 * Where a Lighthouse step is filed. A profiled run records a timespan under the same name the
 * scenario was measured under, so the two line up on (scenario, model) and land in one row carrying
 * both instruments' numbers. A later retry of the same test wins, being the attempt that counted.
 */
type IndexedStep = {
    scenario: string;
    variant: string;
    artifact: string;
    metrics: Record<string, number | null>;
};

const indexFlowSteps = (flows: readonly FlowDocument[]) => {
    const steps = new Map<string, IndexedStep>();

    for (const flow of [...flows].toSorted((a, b) => a.retry - b.retry)) {
        for (const step of flow.steps) {
            steps.set(measurementKey(step.scenario, flow.model), {
                scenario: step.scenario,
                variant: flow.model,
                artifact: flowArtifactName(flow),
                metrics: step.metrics,
            });
        }
    }

    return steps;
};

/**
 * A shard that measured nothing contributes no run, rather than an empty one.
 *
 * Flow documents are optional and additive: without them this returns exactly what it always did.
 * With them, a measurement that has a matching timespan carries the `lh:` numbers beside its
 * `browser:` ones and points at the flow result rather than the history document, so drilling into
 * that row opens a Lighthouse report. A timespan with no measurement of its own — Lighthouse
 * recorded it but our instrumentation produced no median, which is every web scenario today —
 * becomes a row in its own right instead of being dropped.
 */
export const historyToPerfRun = (
    shard: string,
    history: PerfHistoryFile,
    identity: PerfRunIdentity,
    flows: readonly FlowDocument[] = [],
): PerfRun | null => {
    if (history.measurements.length === 0 && flows.length === 0) {
        return null;
    }

    const flowSteps = indexFlowSteps(flows);
    const claimed = new Set<string>();

    const measured = history.measurements.map(measurement => {
        const key = measurementKey(measurement.scenario, measurement.variant);
        const flowStep = flowSteps.get(key);

        claimed.add(key);

        return {
            scenario: measurement.scenario,
            variant: measurement.variant,
            samples: measurement.runs,
            metrics: {
                ...Object.fromEntries(
                    Object.entries(measurement.metrics).map(([metric, value]) => [
                        `${BROWSER_METRIC_PREFIX}:${metric}`,
                        value ?? null,
                    ]),
                ),
                ...(flowStep?.metrics ?? {}),
            },
            artifact: flowStep?.artifact ?? ARTIFACT_NAME,
        };
    });

    // The key is only an identity; the parts travel in the value, so nothing has to be parsed back
    // out of it and a scenario name may contain anything it likes.
    const profiledOnly = [...flowSteps.entries()]
        .filter(([key]) => !claimed.has(key))
        .map(([, step]) => ({
            scenario: step.scenario,
            variant: step.variant,
            // One flow is one recording of the scenario; there is no median over retries here.
            samples: 1,
            metrics: step.metrics,
            artifact: step.artifact,
        }));

    return {
        context: {
            ...identity,
            surface: history.surface,
            shard,
            generatedAt: history.generatedAt,
        },
        artifacts: [
            ...(history.measurements.length > 0
                ? [
                      {
                          kind: 'browser-report' as const,
                          name: ARTIFACT_NAME,
                          body: `${JSON.stringify(history, null, 2)}\n`,
                      },
                  ]
                : []),
            ...flows.map(flow => ({
                kind: 'flow-result' as const,
                name: flowArtifactName(flow),
                body: `${JSON.stringify(flow.flow)}\n`,
            })),
        ],
        measurements: [...measured, ...profiledOnly],
    };
};
