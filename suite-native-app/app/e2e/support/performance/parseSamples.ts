import { PERFORMANCE_LOG_PREFIX } from '@suite-native/performance-metrics';
import type { PerformanceSample, PerformanceScreen } from '@suite-native/performance-metrics';

export type PerformanceLogParseResult = {
    samples: PerformanceSample[];
    /** Lines that carried the prefix but no readable sample. Reported, never thrown. */
    malformedLineCount: number;
};

const isMetricValue = (value: unknown): value is number | null =>
    value === null || (typeof value === 'number' && Number.isFinite(value));

const toSample = (payload: unknown): PerformanceSample | null => {
    if (typeof payload !== 'object' || payload === null) {
        return null;
    }

    const { screen, ttffMs, ttiMs, fidMs, score, timestamp } = payload as Record<string, unknown>;

    if (typeof screen !== 'string' || screen.length === 0) {
        return null;
    }
    if (!isMetricValue(ttffMs) || !isMetricValue(ttiMs) || !isMetricValue(fidMs)) {
        return null;
    }
    if (!isMetricValue(score)) {
        return null;
    }
    if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
        return null;
    }

    return {
        // The app owns the list of instrumented screens. A name this report does not know is kept
        // and reported without limits rather than dropped, so a newly instrumented screen shows up
        // here before anyone remembers to add it to `budgets.ts`.
        screen: screen as PerformanceScreen,
        ttffMs,
        ttiMs,
        fidMs,
        score,
        timestamp,
    };
};

/**
 * Reads the samples out of one device log. The prefix is matched anywhere in the line because a
 * logcat entry carries its own timestamp, pid and tag in front of the app's message.
 */
export const parsePerformanceLog = (logContent: string): PerformanceLogParseResult => {
    const samples: PerformanceSample[] = [];
    let malformedLineCount = 0;

    for (const line of logContent.split('\n')) {
        const prefixIndex = line.indexOf(PERFORMANCE_LOG_PREFIX);

        if (prefixIndex === -1) {
            continue;
        }

        const payload = line.slice(prefixIndex + PERFORMANCE_LOG_PREFIX.length).trim();

        try {
            const sample = toSample(JSON.parse(payload));

            if (sample === null) {
                malformedLineCount += 1;
            } else {
                samples.push(sample);
            }
        } catch {
            malformedLineCount += 1;
        }
    }

    return { samples, malformedLineCount };
};

/**
 * Detox keeps a startup log next to the per-test logs and the two logcat windows can overlap, so
 * the same emission can be read twice. A screen reports at most once per millisecond, which makes
 * the pair unique per emission.
 */
export const dedupeSamples = (samples: readonly PerformanceSample[]): PerformanceSample[] => {
    const seen = new Set<string>();

    return samples.filter(sample => {
        const key = `${sample.screen}\u0000${sample.timestamp}`;

        if (seen.has(key)) {
            return false;
        }
        seen.add(key);

        return true;
    });
};

export const parsePerformanceLogs = (logContents: readonly string[]): PerformanceLogParseResult => {
    const results = logContents.map(parsePerformanceLog);

    return {
        samples: dedupeSamples(results.flatMap(result => result.samples)),
        malformedLineCount: results.reduce((total, result) => total + result.malformedLineCount, 0),
    };
};
