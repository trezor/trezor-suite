import { slugify } from './store';
import type { PerfSurface } from './store';

/**
 * The Lighthouse side of the store: what a profiled run leaves behind, trimmed to what is worth
 * keeping, and the mapping from its audits into namespaced metrics.
 *
 * Lighthouse itself is not a dependency here. This package is the pure, testable half — the types
 * below describe only the shape we read, so a flow result can be stripped and mapped without a
 * browser, and `suite/e2e` keeps the heavy imports.
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

/**
 * The audits worth a column. Deliberately excludes the `trezor-*` synthetic audits the experiment
 * branch injected: those numbers already travel as `browser:` keys from our own instrumentation,
 * and a second copy under another prefix would invite exactly the cross-instrument comparison the
 * namespacing exists to prevent.
 */
export const LIGHTHOUSE_AUDITS = [
    'total-blocking-time',
    'mainthread-work-breakdown',
    'bootup-time',
    'cumulative-layout-shift',
    'total-byte-weight',
] as const;

/**
 * What never reaches the store. Screenshots are the bulk of an LHR and the only part that can show a
 * wallet screen; `user-timings` details are unbounded — a profiling build emits tens of thousands of
 * entries, most of the document. The audits themselves stay, so the rendered report still lists
 * them; only the payloads go.
 */
const DROPPED_AUDITS = ['final-screenshot', 'screenshot-thumbnails'] as const;
const DETAIL_ONLY_AUDITS = ['user-timings'] as const;

const stripLhr = (lhr: LhrLike): LhrLike => {
    const { fullPageScreenshot: _dropped, ...rest } = lhr;
    const audits = { ...(rest.audits ?? {}) };

    for (const id of DROPPED_AUDITS) {
        delete audits[id];
    }
    for (const id of DETAIL_ONLY_AUDITS) {
        const audit = audits[id];

        if (audit) {
            const { details: _details, ...keptAudit } = audit;

            audits[id] = keptAudit;
        }
    }

    return rest.audits ? { ...rest, audits } : rest;
};

/**
 * Strips every step of a flow result. Idempotent, and a document missing any of these fields passes
 * through unharmed — Lighthouse versions move these around, and losing the artifact over it would
 * be worse than storing one field too many.
 */
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

/**
 * One artifact per test, shared by every step it recorded. The name has to survive `artifactKey`,
 * which slugifies it and appends `.json`, and has to stay unique within a shard: two device models
 * run the same title, and a retry re-runs it again.
 */
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
    /**
     * Whatever Lighthouse produced. Taken as `unknown` on purpose: its own `Result` type carries no
     * index signature, so the structural types above cannot describe it without either a cast at
     * every call site or a looser shape that stops describing what we read. The assumption belongs
     * here, next to the code that acts on it, rather than in the harness.
     */
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
