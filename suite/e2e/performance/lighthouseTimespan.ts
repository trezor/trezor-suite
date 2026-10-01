import { ElectronApplication, Page, TestInfo } from '@playwright/test';
import { readFileSync, writeFileSync } from 'fs';
import { type Flags, generateReport, startFlow } from 'lighthouse';
import path from 'path';
import {
    type Browser,
    type Page as BrowserPage,
    type ConnectOptions,
    connect,
} from 'puppeteer-core';

import { buildFlowDocument, resolveSurface } from '@trezor/perf-e2e';

import { LighthouseMode, getLighthouseDebugPort, getLighthouseMode } from './lighthouseConfig';
import { writeFlowDocument } from './perfHistory';

/**
 * Lighthouse timespan mode inside a Playwright test.
 * @see https://github.com/GoogleChrome/lighthouse/blob/main/docs/user-flows.md#timespan
 *
 * Answers "what would Lighthouse say about the interactions we already measure ourselves?". A
 * timespan is recorded around each `perf.measure` block (or around the whole test, see
 * `LighthouseMode`) and the run stores Lighthouse's own flow result — one navigable step per
 * timespan — so it can be fetched later and rendered as a report offline.
 *
 * Nothing here is baselined or gated: a number Lighthouse reports never fails a test, and neither
 * does Lighthouse failing to report one. What it buys over `perf.measure` is Lighthouse's breakdown
 * of the same interaction — main-thread work by category, script bootup, third-party cost — rather
 * than one more set of totals.
 *
 * Why it talks to the app through Puppeteer rather than the Playwright page: Lighthouse drives the
 * target with Puppeteer's CDPSession, using wildcard `'*'` protocol events, `session.id()` and
 * `sessionattached` — none of which Playwright's CDPSession exposes. So `puppeteer-core` attaches
 * to the app's CDP endpoint and to the very target the test is driving.
 */

// Lands in the test's output dir (`test-results/<project>-<test>/`), for looking at locally. The
// copy that outlives the run is the flow document, which goes to PERF_HISTORY_DIR — Playwright
// cleans its own output directory, so nothing left there survives to the upload step.
const FLOW_REPORT_FILE = 'lighthouse-flow-report.html';

/**
 * Measure the app as the test drives it. Lighthouse otherwise emulates a throttled mobile device,
 * which mid-test would resize the window, rewrite the user agent and slow the CPU down — enough to
 * break the very test we are riding inside.
 */
const AS_IS_FLAGS: Flags = {
    formFactor: 'desktop',
    screenEmulation: { disabled: true },
    emulatedUserAgent: false,
    throttlingMethod: 'provided',
    logLevel: 'error',
    onlyCategories: ['performance'],
};

export type LighthouseFlow = {
    /** Records a timespan around `interaction`. */
    timespan: <T>(name: string, interaction: () => Promise<T>) => Promise<T>;
    /** Audits the recorded steps and writes the flow document. */
    finish: () => Promise<void>;
};

// With Lighthouse off — or unable to attach — the interactions still run, and the test behaves
// exactly as it does without profiling.
const passthroughFlow: LighthouseFlow = {
    timespan: (_name, interaction) => interaction(),
    finish: async () => {},
};

// Electron writes the CDP port Playwright had it open to DevToolsActivePort; desktop needs no fixed port.
const resolveEndpoint = async (
    electronApp: ElectronApplication | undefined,
): Promise<ConnectOptions> => {
    if (!electronApp) {
        return { browserURL: `http://127.0.0.1:${getLighthouseDebugPort()}` };
    }

    const userDataDir = await electronApp.evaluate(({ app }) => app.getPath('userData'));
    const [port, browserPath] = readFileSync(
        path.join(userDataDir, 'DevToolsActivePort'),
        'utf8',
    ).split('\n');

    return { browserWSEndpoint: `ws://127.0.0.1:${port}${browserPath}` };
};

/**
 * `null` rather than a throw: the app not exposing a debugging endpoint is an infrastructure fault,
 * and an infrastructure fault must not decide a test's verdict. The run loses its profile and says
 * so; the suite stays green on its own merits.
 */
const connectToAppUnderTest = async (
    electronApp: ElectronApplication | undefined,
): Promise<Browser | null> => {
    try {
        return await connect({ ...(await resolveEndpoint(electronApp)), defaultViewport: null });
    } catch (error) {
        console.warn(
            '[lighthouse] could not attach to the app under test, so this test is not profiled:',
            error,
        );

        return null;
    }
};

/**
 * The same target the test drives, so a timespan covers the window under test rather than some
 * other page the browser happens to have open.
 */
const findPageUnderTest = async (browser: Browser, page: Page): Promise<BrowserPage | null> => {
    const pages = await browser.pages();
    const matchingUrl = pages.filter(candidate => candidate.url() === page.url());
    // A lone page is the one under test even when the two URL readings disagree, which they do while
    // the app is navigating. More than one match is not worth guessing about.
    const candidates = matchingUrl.length === 0 ? pages : matchingUrl;
    const [pageUnderTest] = candidates;

    if (!pageUnderTest || candidates.length > 1) {
        console.warn(
            `[lighthouse] could not tell which page is under test (${page.url()}) among the ` +
                `${pages.length} open: ${pages.map(candidate => candidate.url()).join(', ') || 'none'}. ` +
                'This test is not profiled.',
        );

        return null;
    }

    return pageUnderTest;
};

type StartLighthouseFlowParams = {
    page: Page;
    electronApp: ElectronApplication | undefined;
    testInfo: TestInfo;
    mode: Exclude<LighthouseMode, typeof LighthouseMode.Off>;
};

export const startLighthouseFlow = async ({
    page,
    electronApp,
    testInfo,
    mode,
}: StartLighthouseFlowParams): Promise<LighthouseFlow> => {
    if (getLighthouseMode() !== mode) {
        return passthroughFlow;
    }

    const browser = await connectToAppUnderTest(electronApp);

    if (!browser) {
        return passthroughFlow;
    }

    const pageUnderTest = await findPageUnderTest(browser, page);

    if (!pageUnderTest) {
        await browser.disconnect();

        return passthroughFlow;
    }

    const flow = await startFlow(pageUnderTest, { name: testInfo.title, flags: AS_IS_FLAGS });
    let recordedSteps = 0;

    const timespan = async <T>(name: string, interaction: () => Promise<T>): Promise<T> => {
        await flow.startTimespan({ name });

        try {
            return await interaction();
        } finally {
            // A timespan that cannot be closed costs us the step, not the run: profiling never gets
            // to decide a test's verdict, and swallowing the failure here keeps the error the
            // interaction itself threw as the one the report shows.
            await flow.endTimespan().then(
                () => {
                    recordedSteps += 1;
                },
                (error: unknown) => {
                    console.warn(`[lighthouse] step "${name}" was not recorded:`, error);
                },
            );
        }
    };

    return {
        timespan,

        finish: async () => {
            try {
                if (recordedSteps === 0) {
                    return;
                }

                // Auditing the gathered steps is the expensive half of Lighthouse, so it happens
                // once here rather than per step, and everything below is rendered from its result.
                const flowResult = await flow.createFlowResult();
                // outputPath, not outputDir: it creates the directory if the test has not written
                // anything into it yet.
                const reportPath = testInfo.outputPath(FLOW_REPORT_FILE);

                writeFileSync(reportPath, generateReport(flowResult, 'html'));
                await testInfo.attach(FLOW_REPORT_FILE, {
                    path: reportPath,
                    contentType: 'text/html',
                });

                // The stored copy: stripped of screenshots and unbounded details, and written
                // beside the history documents so the publish job finds it.
                const surface = resolveSurface(process.env.PERF_SURFACE);

                if (surface) {
                    writeFlowDocument(
                        buildFlowDocument({
                            surface,
                            model: testInfo.project.name,
                            title: testInfo.title,
                            retry: testInfo.retry,
                            flow: flowResult,
                        }),
                        process.env.PERF_HISTORY_DIR,
                        message => {
                            // eslint-disable-next-line no-console
                            console.log(message);
                        },
                    );
                }
            } catch (error) {
                // Same rule as a step that cannot be closed: a report we fail to write is worth a
                // loud line in the log, never a failed test.
                console.warn('[lighthouse] the flow report could not be written:', error);
            } finally {
                await browser.disconnect();
            }
        },
    };
};
