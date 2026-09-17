import type { PerformanceSample } from '@suite-native/performance-metrics';

import { aggregateSamples, groupSamplesByScreen, median, roundMetric } from './aggregate';
import { BASELINES, LIMITS } from './budgets';
import { compareScreen } from './compare';
import type {
    PerformanceMetricRow,
    PerformanceMetricUnit,
    PerformanceMetricValues,
    PerformanceReport,
    PerformanceReportMeta,
    PerformanceScreenReport,
} from './types';

const TABLE_WIDTH = 78;

const UNIT_SUFFIX: Record<PerformanceMetricUnit, string> = {
    ms: ' ms',
    score: '',
};

export const formatMetricValue = (value: number | null, unit: PerformanceMetricUnit): string =>
    value === null ? 'n/a' : `${roundMetric(value)}${UNIT_SUFFIX[unit]}`;

const formatRatio = (metric: PerformanceMetricRow): string =>
    metric.ratioToLimit === null ? 'n/a' : `${Math.round(metric.ratioToLimit * 100)}%`;

const screenVerdict = (screen: PerformanceScreenReport): string => {
    if (screen.overLimit) {
        return 'OVER LIMIT';
    }

    return screen.unlimited ? 'no limits set (nothing measured against)' : 'within limits';
};

/**
 * The overall grade is the median of the per-screen medians, not of every sample: a screen the
 * flows happen to visit ten times must not outvote the four visited once.
 */
const aggregateScore = (screens: readonly PerformanceScreenReport[]): number | null => {
    const scores = screens
        .map(screen => screen.metrics.find(metric => metric.key === 'lighthouseScore')?.current)
        .filter((score): score is number => score !== undefined && score !== null);
    const medianScore = median(scores);

    return medianScore === null ? null : Math.round(medianScore);
};

export const buildPerformanceReport = (
    samples: readonly PerformanceSample[],
    meta: Omit<PerformanceReportMeta, 'sampleCount'>,
): PerformanceReport => {
    const grouped = groupSamplesByScreen(samples);
    const screens = [...grouped.entries()]
        // Alphabetical rather than visit order, so two runs of the same suite produce diffable
        // reports even when the flows run in a different order.
        .toSorted(([left], [right]) => left.localeCompare(right))
        .map(([screen, screenSamples]) =>
            compareScreen({
                scenario: screen,
                sampleCount: screenSamples.length,
                current: aggregateSamples(screenSamples),
                baseline: BASELINES[screen],
                limits: LIMITS[screen],
            }),
        );

    return {
        meta: { ...meta, sampleCount: samples.length },
        screens,
        aggregate: {
            score: aggregateScore(screens),
            overLimit: screens.some(screen => screen.overLimit),
        },
    };
};

const formatScreenBlock = (screen: PerformanceScreenReport): string[] => [
    '',
    `Screen: ${screen.scenario}  (median of ${screen.sampleCount} sample${screen.sampleCount === 1 ? '' : 's'})   ->   ${screenVerdict(screen)}`,
    `  ${'metric'.padEnd(24)}${'current'.padEnd(12)}${'limit'.padEnd(12)}${'% of limit'.padEnd(12)}baseline`,
    ...screen.metrics.map(
        metric =>
            `  ${metric.label.padEnd(24)}${formatMetricValue(metric.current, metric.unit).padEnd(12)}` +
            `${formatMetricValue(metric.limit, metric.unit).padEnd(12)}${formatRatio(metric).padEnd(12)}` +
            `${formatMetricValue(metric.baseline, metric.unit)}${metric.exceededLimit ? ' !!' : ''}`,
    ),
];

const toBaselineEntry = (
    screen: PerformanceScreenReport,
): [string, Partial<PerformanceMetricValues>] => [
    screen.scenario,
    Object.fromEntries(
        screen.metrics
            .filter(metric => metric.current !== null)
            .map(metric => [metric.key, metric.current]),
    ),
];

export const formatPerformanceReport = (report: PerformanceReport): string => {
    const { meta, screens, aggregate } = report;
    const border = '='.repeat(TABLE_WIDTH);

    const header = [
        '',
        border,
        'NATIVE PERFORMANCE REPORT',
        border,
        `platform: ${meta.platform}   device: ${meta.device}   app: ${meta.appVersion}`,
        `commit: ${meta.commitHash}   generated: ${meta.generatedAt}   samples: ${meta.sampleCount}`,
    ];

    const body =
        screens.length > 0
            ? screens.flatMap(formatScreenBlock)
            : ['', 'No instrumented screen reported a measurement in this run.'];

    const verdict = aggregate.overLimit
        ? `Result: OVER LIMIT — ${screens
              .filter(screen => screen.overLimit)
              .map(screen => screen.scenario)
              .join(', ')}. Reported only, the run is not failed.`
        : 'Result: within limits.';

    const footer = [
        '',
        '-'.repeat(TABLE_WIDTH),
        `Overall score: ${aggregate.score === null ? 'n/a' : aggregate.score}`,
        verdict,
    ];

    const baselineHint =
        screens.length > 0
            ? [
                  '',
                  'To record these numbers, paste into BASELINES in e2e/performance/budgets.ts:',
                  JSON.stringify(Object.fromEntries(screens.map(toBaselineEntry)), null, 4),
              ]
            : [];

    return [...header, ...body, ...footer, ...baselineHint, border, ''].join('\n');
};
