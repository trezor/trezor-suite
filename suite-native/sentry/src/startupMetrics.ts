import { captureStartupPerformanceReport } from './startupPerformance';

let jsBundleEvaluatedAtMs: number | undefined;
let hasReportedAppLoad = false;

export const markStartupJsBundleEvaluated = () => {
    if (jsBundleEvaluatedAtMs) return;

    jsBundleEvaluatedAtMs = performance.now();
};

export const reportStartupAppLoaded = () => {
    if (hasReportedAppLoad) return;

    if (!jsBundleEvaluatedAtMs) return;

    hasReportedAppLoad = true;

    const appLoadDurationMs = performance.now() - jsBundleEvaluatedAtMs;
    // Sentry reads span times as Unix time, while performance.now() on React Native counts from
    // device boot.
    const endedAtMs = Date.now();

    captureStartupPerformanceReport({
        startedAtMs: endedAtMs - appLoadDurationMs,
        endedAtMs,
        measurements: {
            appLoad: appLoadDurationMs,
        },
    });
};
