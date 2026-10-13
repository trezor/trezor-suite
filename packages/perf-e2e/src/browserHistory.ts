import type { FlowDocument } from './lighthouseFlow';
import { flowArtifactName } from './lighthouseFlow';
import type { PerfRunIdentity } from './publishRuns';
import type { PerfRun, PerfSurface } from './store';
import type { PerfMetrics } from './types';

/** The history document web and desktop shards write, and its mapping into the store. */

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

/** Our in-page instrumentation, on web and inside Electron alike; Lighthouse's are `lh:`. */
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

/** Each Playwright process of a shard writes its own document; a later measurement wins. */
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

/** A timespan is named after its scenario, so it joins the measurement on (scenario, model). */
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
 * `null` for a shard that measured nothing. A measurement with a matching timespan also carries its
 * `lh:` numbers and links the flow result; a timespan without a measurement (every web scenario
 * today) becomes a row of its own.
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
            // From the documents, not an env flag: a run whose attach failed was not profiled.
            ...(flows.length > 0 ? { profiled: true } : {}),
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
