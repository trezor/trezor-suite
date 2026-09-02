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

    const endedAtMs = performance.now();
    const appLoadDurationMs = endedAtMs - jsBundleEvaluatedAtMs;

    captureStartupPerformanceReport({
        startedAtMs: jsBundleEvaluatedAtMs,
        endedAtMs,
        measurements: {
            appLoad: appLoadDurationMs,
        },
    });
};
