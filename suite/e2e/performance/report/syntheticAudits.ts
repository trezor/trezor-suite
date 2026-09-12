import { PerfMetricKey, PerfMetrics } from '@trezor/perf-e2e';

import { Lhr } from './collect';

/**
 * Bridges the perf-e2e in-page metrics into the LHR before upload, as informative `trezor-*`
 * audits: the LHCI server then stores, trends and diffs them exactly like Lighthouse's own numbers.
 * This module is the seam a real Lighthouse plugin with a timespan gatherer would replace.
 */

type SyntheticAuditSpec = {
    id: string;
    title: string;
    perfKey: PerfMetricKey;
    numericUnit: 'millisecond' | 'unitless';
};

export const SYNTHETIC_AUDITS: SyntheticAuditSpec[] = [
    {
        id: 'trezor-react-commit-count',
        title: 'React commits during the interaction',
        perfKey: 'reactCommitCount',
        numericUnit: 'unitless',
    },
    {
        id: 'trezor-interaction-duration',
        title: 'Interaction duration (in-page)',
        perfKey: 'interactionDurationMs',
        numericUnit: 'millisecond',
    },
    {
        id: 'trezor-long-task-count',
        title: 'Long tasks during the interaction',
        perfKey: 'longTaskCount',
        numericUnit: 'unitless',
    },
    {
        id: 'trezor-longest-task',
        title: 'Longest task',
        perfKey: 'longestTaskMs',
        numericUnit: 'millisecond',
    },
    {
        id: 'trezor-total-blocking-time-inpage',
        title: 'Total Blocking Time (in-page)',
        perfKey: 'totalBlockingTimeMs',
        numericUnit: 'millisecond',
    },
];

export const COMPONENT_RENDER_COUNTS_AUDIT_ID = 'trezor-component-render-counts';

/** Enough to see what dominates a regression; the full list is 10⁴–10⁵ rows of noise. */
const TOP_COMPONENT_COUNT = 20;

type Audit = Lhr['audits'][string];

const informativeAudit = (
    spec: Pick<
        Audit,
        'id' | 'title' | 'description' | 'numericValue' | 'numericUnit' | 'displayValue'
    > &
        Partial<Pick<Audit, 'details'>>,
): Audit =>
    ({
        score: null,
        scoreDisplayMode: 'informative',
        ...spec,
    }) as Audit;

const syntheticAuditsFor = (perfMetrics: PerfMetrics): Audit[] =>
    SYNTHETIC_AUDITS.flatMap(({ id, title, perfKey, numericUnit }) => {
        const value = perfMetrics[perfKey];
        // A metric the environment could not measure is absent, not zero — zero would trend.
        if (value === null || value === undefined) {
            return [];
        }

        return [
            informativeAudit({
                id,
                title,
                description:
                    'Measured in-page by @trezor/perf-e2e around the same interaction as this timespan.',
                numericValue: value,
                numericUnit,
                displayValue:
                    numericUnit === 'millisecond' ? `${Math.round(value)} ms` : `${value}`,
            }),
        ];
    });

type UserTimingItem = { name?: string; timingType?: string };

const componentRenderCountsAudit = (userTimings: Audit): Audit | null => {
    const details = userTimings.details as { items?: UserTimingItem[] } | undefined;
    if (!details?.items?.length) {
        return null;
    }

    const countsByName = new Map<string, number>();
    for (const item of details.items) {
        if (item.timingType !== 'Measure' || !item.name) {
            continue;
        }
        countsByName.set(item.name, (countsByName.get(item.name) ?? 0) + 1);
    }

    const top = [...countsByName.entries()]
        .toSorted((a, b) => b[1] - a[1])
        .slice(0, TOP_COMPONENT_COUNT)
        .map(([name, count]) => ({ name, count }));

    if (top.length === 0) {
        return null;
    }

    return informativeAudit({
        id: COMPONENT_RENDER_COUNTS_AUDIT_ID,
        title: 'Component render counts (top by user-timing measures)',
        description:
            'The most-rendered component names, aggregated from the user-timing measures the ' +
            'profiling build emits per render. The compact stand-in for the per-entry list that ' +
            'is stripped before upload.',
        numericValue: details.items.length,
        numericUnit: 'unitless',
        displayValue: `${details.items.length} measures`,
        details: {
            type: 'table',
            headings: [
                { key: 'name', valueType: 'text', label: 'Component' },
                { key: 'count', valueType: 'numeric', label: 'Renders' },
            ],
            items: top,
        } as Audit['details'],
    });
};

/**
 * Returns a copy ready for upload: `trezor-*` audits injected, and `user-timings` reduced to its
 * shell. Stripping is a hard requirement, not hygiene — a profiling build emits one measure per
 * component render (70k+ entries, up to 73% of the LHR), which blows the server's 10 MB body limit
 * and crashes its compare UI outright. The count still trends via the audit shell, the per-entry
 * list survives in the CI artifact and locally, and the aggregate above keeps the useful part.
 */
export const augmentLhr = (lhr: Lhr, perfMetrics: PerfMetrics | null): Lhr => {
    const audits = { ...lhr.audits };
    const injectedIds: string[] = [];

    for (const audit of perfMetrics ? syntheticAuditsFor(perfMetrics) : []) {
        audits[audit.id] = audit;
        injectedIds.push(audit.id);
    }

    const userTimings = audits['user-timings'];
    if (userTimings?.details) {
        const aggregate = componentRenderCountsAudit(userTimings);
        if (aggregate) {
            audits[aggregate.id] = aggregate;
            injectedIds.push(aggregate.id);
        }

        const { details: _stripped, ...shell } = userTimings;
        audits['user-timings'] = shell as Audit;
    }

    // The server's UI and statistics enumerate a category's auditRefs, never the audits map — an
    // unreferenced audit is stored but unreachable. Weight 0 leaves the score untouched; the
    // diagnostics group because ungrouped refs are hidden once a category uses groups at all.
    const performance = lhr.categories?.performance;
    const categories =
        performance && injectedIds.length > 0
            ? {
                  ...lhr.categories,
                  performance: {
                      ...performance,
                      auditRefs: [
                          ...(performance.auditRefs ?? []),
                          ...injectedIds.map(id => ({ id, weight: 0, group: 'diagnostics' })),
                      ],
                  },
              }
            : lhr.categories;

    return { ...lhr, audits, categories };
};
