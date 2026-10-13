import { slugify } from './store';
import type { PerfSurface } from './store';

/**
 * Strips a Lighthouse flow result for storage and maps its audits to `lh:` metrics. Lighthouse is
 * not a dependency: the types describe only the shape we read.
 */

/** Only the fields we read or remove; a real LHR carries far more, and all of it is preserved. */
export type LhrLike = {
    audits?: Record<string, { numericValue?: number | null; details?: unknown } | undefined>;
    /** Lighthouse 13 carries the full-page screenshot here, not as an audit. */
    fullPageScreenshot?: unknown;
    [key: string]: unknown;
};

export type FlowResultLike = {
    steps?: { name?: string; lhr?: LhrLike }[];
    [key: string]: unknown;
};

/** Discriminates this from a `PerfHistoryFile` when both sit in the same directory. */
export const FLOW_DOCUMENT_KIND = 'lighthouse-flow';

export type FlowStep = {
    /** The name the timespan was recorded under, i.e. the scenario `perf.measure` was given. */
    scenario: string;
    metrics: Record<string, number | null>;
};

export type FlowDocument = {
    kind: typeof FLOW_DOCUMENT_KIND;
    surface: PerfSurface;
    generatedAt: string;
    /** Playwright project, i.e. the device model — the same value a measurement's variant carries. */
    model: string;
    title: string;
    retry: number;
    steps: FlowStep[];
    /** The stripped flow result, kept whole so it still renders as a Lighthouse report. */
    flow: FlowResultLike;
};

/** Namespaced by the instrument: these are Lighthouse's numbers, never our in-page `browser:` ones. */
export const LIGHTHOUSE_METRIC_PREFIX = 'lh';

/** Our own in-page numbers already travel as `browser:` keys, so they are not duplicated here. */
export const LIGHTHOUSE_AUDITS = [
    'total-blocking-time',
    'mainthread-work-breakdown',
    'bootup-time',
    'cumulative-layout-shift',
    'total-byte-weight',
] as const;

/**
 * Screenshots are the bulk of an LHR and can show a wallet screen; `user-timings` details are
 * unbounded. Only their `details` are dropped: the report renderer dereferences every
 * `auditRefs` id and throws on a missing audit.
 */
const STRIPPED_AUDITS = ['final-screenshot', 'screenshot-thumbnails', 'user-timings'] as const;

const stripLhr = (lhr: LhrLike): LhrLike => {
    const { fullPageScreenshot: _dropped, ...rest } = lhr;

    if (!rest.audits) {
        return rest;
    }

    const audits = { ...rest.audits };

    for (const id of STRIPPED_AUDITS) {
        const audit = audits[id];

        if (audit) {
            const { details: _details, ...keptAudit } = audit;

            audits[id] = keptAudit;
        }
    }

    return { ...rest, audits };
};

/** Idempotent; fields missing in another Lighthouse version are passed through. */
export const stripFlowResult = (flow: FlowResultLike): FlowResultLike =>
    flow.steps
        ? {
              ...flow,
              steps: flow.steps.map(step =>
                  step.lhr ? { ...step, lhr: stripLhr(step.lhr) } : step,
              ),
          }
        : flow;

/** `null` for an audit this run could not produce, which is not the same as a zero. */
export const flowMetrics = (lhr: LhrLike | undefined): Record<string, number | null> =>
    Object.fromEntries(
        LIGHTHOUSE_AUDITS.map(id => {
            const value = lhr?.audits?.[id]?.numericValue;

            return [
                `${LIGHTHOUSE_METRIC_PREFIX}:${id}`,
                typeof value === 'number' && Number.isFinite(value) ? value : null,
            ];
        }),
    );

/** One artifact per test, unique within a shard across device models and retries. */
export const flowArtifactName = ({ title, model, retry }: FlowDocument): string =>
    slugify(`flow-${title}-${model}-${retry}`);

export const buildFlowDocument = ({
    surface,
    model,
    title,
    retry,
    flow,
    generatedAt = new Date().toISOString(),
}: {
    surface: PerfSurface;
    model: string;
    title: string;
    retry: number;
    /** `unknown`: Lighthouse's `Result` has no index signature to match the types above. */
    flow: unknown;
    generatedAt?: string;
}): FlowDocument => {
    const stripped = stripFlowResult(flow as FlowResultLike);

    return {
        kind: FLOW_DOCUMENT_KIND,
        surface,
        generatedAt,
        model,
        title,
        retry,
        steps: (stripped.steps ?? []).map(step => ({
            scenario: step.name ?? '',
            metrics: flowMetrics(step.lhr),
        })),
        flow: stripped,
    };
};

export const isFlowDocument = (value: unknown): value is FlowDocument =>
    typeof value === 'object' &&
    value !== null &&
    (value as { kind?: unknown }).kind === FLOW_DOCUMENT_KIND;
