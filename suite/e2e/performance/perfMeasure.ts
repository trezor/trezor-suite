import { CDPSession, Page, TestInfo } from '@playwright/test';
import { writeFileSync } from 'fs';
import path from 'path';

import {
    PerfMetrics,
    buildJsonReport,
    compareScenario,
    formatHumanReport,
    getScenarioBaseline,
    getScenarioLimits,
    readPerfMetrics,
    startPerfMeasurement,
} from '@trezor/perf-e2e';

import { BASELINES, LIMITS } from './budgets';

// Lets the long-task observer flush and trailing renders settle before metrics are read.
const SETTLE_MS = 400;

// Chrome trace categories that make a rerender/long-task investigation possible.
const TRACE_CATEGORIES = [
    'devtools.timeline',
    'disabled-by-default-devtools.timeline',
    'v8.execute',
    'disabled-by-default-v8.cpu_profiler',
    'blink.user_timing',
    'loading',
    'toplevel',
];

/**
 * Measures a single interaction and holds it to the limits of its scenario.
 *
 * Instrumentation is installed globally at app load (see `electronSetup`), so no reload is needed
 * here. On a target where it was not installed, the interaction still runs and measurement is
 * skipped.
 */
export const measurePerformance = async (
    page: Page,
    testInfo: TestInfo,
    scenario: string,
    interaction: () => Promise<void>,
): Promise<PerfMetrics | null> => {
    const installed = await page.evaluate(
        () =>
            typeof (window as unknown as { __trezorPerf__?: unknown }).__trezorPerf__ !==
            'undefined',
    );
    if (!installed) {
        // eslint-disable-next-line no-console
        console.log(
            `[perf] instrumentation not installed (non-web target?) — skipping "${scenario}"`,
        );
        await interaction();

        return null;
    }

    // CDP tracing is best-effort — creating the session or starting tracing may be unavailable
    // (e.g. on some targets); never fail a measurement because of it.
    const traceEvents: unknown[] = [];
    let client: CDPSession | null = null;
    let tracing = false;
    try {
        client = await page.context().newCDPSession(page);
        client.on('Tracing.dataCollected', (payload: { value?: unknown[] }) => {
            if (Array.isArray(payload.value)) {
                traceEvents.push(...payload.value);
            }
        });
        await client.send('Tracing.start', {
            transferMode: 'ReportEvents',
            traceConfig: { recordMode: 'recordUntilFull', includedCategories: TRACE_CATEGORIES },
        });
        tracing = true;
    } catch {
        client = null;
    }

    await page.evaluate(startPerfMeasurement);
    await interaction();
    await page.waitForTimeout(SETTLE_MS);
    const current = await page.evaluate(readPerfMetrics);

    if (client && tracing) {
        const session = client;
        const complete = new Promise<void>(resolve =>
            session.once('Tracing.tracingComplete', () => resolve()),
        );
        await session.send('Tracing.end');
        await complete;
    }
    if (client) {
        await client.detach().catch(() => {});
    }

    const comparison = compareScenario(
        scenario,
        current,
        getScenarioBaseline(BASELINES, scenario),
        getScenarioLimits(LIMITS, scenario),
    );
    const humanReport = formatHumanReport(comparison);

    await testInfo.attach(`perf-report-${scenario}.json`, {
        body: JSON.stringify(buildJsonReport(comparison), null, 2),
        contentType: 'application/json',
    });

    // eslint-disable-next-line no-console
    console.log(`\n${humanReport}\n`);

    if (comparison.failed) {
        if (tracing) {
            // Openable in Perfetto / chrome://tracing. Saved on any breach, enforced or not.
            const tracePath = path.join(testInfo.outputDir, `perf-trace-${scenario}.json`);
            writeFileSync(tracePath, JSON.stringify({ traceEvents }));
            testInfo.attachments.push({
                name: `perf-trace-${scenario}`,
                contentType: 'application/json',
                path: tracePath,
            });
        }

        // Enforced by default; PERF_REPORT_ONLY=1 downgrades a breach to a warning.
        if (process.env.PERF_REPORT_ONLY === '1') {
            console.warn(
                `[perf] "${scenario}" went over its limit — review the report above. Raising the ` +
                    'limit in performance/limits.json is a deliberate decision about what the app ' +
                    'may cost. (report-only mode)',
            );
        } else {
            throw new Error(humanReport);
        }
    }

    return current;
};
