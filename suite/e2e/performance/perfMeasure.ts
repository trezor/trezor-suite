import { Page, TestInfo } from '@playwright/test';

import {
    PerfMetrics,
    buildJsonReport,
    compareScenario,
    endPerfInteraction,
    formatHumanReport,
    readPerfMetrics,
    startPerfMeasurement,
} from '@trezor/perf-e2e';

import { BASELINES, LIMITS } from './budgets';

// Lets the long-task observer flush and trailing renders settle before metrics are read.
const SETTLE_MS = 400;

/**
 * Measures a single interaction and reports it against the limits of its scenario. Going over a
 * limit never fails the test.
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

    await page.evaluate(startPerfMeasurement);
    await interaction();
    // The clock stops with the interaction; the settle wait below only lets trailing long tasks and
    // renders arrive, and must not be reported as time the interaction took.
    await page.evaluate(endPerfInteraction);
    await page.waitForTimeout(SETTLE_MS);
    const current = await page.evaluate(readPerfMetrics);

    const comparison = compareScenario(scenario, current, BASELINES[scenario], LIMITS[scenario]);
    const humanReport = formatHumanReport(comparison);

    await testInfo.attach(`perf-report-${scenario}.json`, {
        body: JSON.stringify(buildJsonReport(comparison), null, 2),
        contentType: 'application/json',
    });

    // eslint-disable-next-line no-console
    console.log(`\n${humanReport}\n`);

    // Deliberately never thrown: going over a limit is reported, not turned into a test failure. A
    // performance number is not on its own a reason to block a merge, and the end-of-run report is
    // where a breach is meant to be noticed.
    if (comparison.overLimit) {
        console.warn(
            `[perf] "${scenario}" went over its limit — see the report above. Raising the limit in ` +
                'performance/budgets.ts is a deliberate decision about what the app may cost.',
        );
    }

    return current;
};
