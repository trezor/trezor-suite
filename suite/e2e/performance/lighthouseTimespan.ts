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
 * Lighthouse timespans around a Playwright test's interactions, stored as a flow result. Never
 * gates a test, including when Lighthouse itself fails. See docs/tests/perf-history.md.
 * @see https://github.com/GoogleChrome/lighthouse/blob/main/docs/user-flows.md#timespan
 *
 * Attaches through `puppeteer-core`: Lighthouse needs wildcard CDP events, `session.id()` and
 * `sessionattached`, which Playwright's CDPSession does not expose.
 */

// Local copy only; Playwright cleans its output dir, so the stored copy goes to PERF_HISTORY_DIR.
const FLOW_REPORT_FILE = 'lighthouse-flow-report.html';

/** No mobile emulation or throttling: resizing or slowing the app mid-test breaks the test. */
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

const passthroughFlow: LighthouseFlow = {
    timespan: (_name, interaction) => interaction(),
    finish: async () => {},
};

const DEVTOOLS_PORT_FILE = 'DevToolsActivePort';
const DEVTOOLS_PORT_TIMEOUT = 10_000;
const DEVTOOLS_PORT_POLL_INTERVAL = 100;

/** `null` until both lines are readable: the file is written port-first. */
const readDevToolsEndpoint = (userDataDir: string): string | null => {
    let contents;
    try {
        contents = readFileSync(path.join(userDataDir, DEVTOOLS_PORT_FILE), 'utf8');
    } catch {
        return null;
    }

    const [port, browserPath] = contents.split('\n');

    return /^\d+$/.test(port ?? '') && browserPath?.startsWith('/devtools/')
        ? `ws://127.0.0.1:${port}${browserPath}`
        : null;
};

/**
 * Playwright launches Electron with `--remote-debugging-port=0`, and Chromium writes the chosen
 * port to DevToolsActivePort in userData. Polled: app startup may empty userData after the write.
 */
const resolveEndpoint = async (
    electronApp: ElectronApplication | undefined,
): Promise<ConnectOptions> => {
    // Web: Playwright drives Chromium over a pipe, so the project config opens a fixed port.
    if (!electronApp) {
        return { browserURL: `http://127.0.0.1:${getLighthouseDebugPort()}` };
    }

    const userDataDir = await electronApp.evaluate(({ app }) => app.getPath('userData'));
    const deadline = Date.now() + DEVTOOLS_PORT_TIMEOUT;

    while (true) {
        const endpoint = readDevToolsEndpoint(userDataDir);

        if (endpoint) {
            return { browserWSEndpoint: endpoint };
        }

        if (Date.now() >= deadline) {
            throw new Error(
                `no readable ${DEVTOOLS_PORT_FILE} under ${userDataDir} after ${DEVTOOLS_PORT_TIMEOUT}ms`,
            );
        }

        await new Promise(resolve => setTimeout(resolve, DEVTOOLS_PORT_POLL_INTERVAL));
    }
};

/** `null` rather than a throw: an infrastructure fault must not decide a test's verdict. */
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

const findPageUnderTest = async (browser: Browser, page: Page): Promise<BrowserPage | null> => {
    const pages = await browser.pages();
    const matchingUrl = pages.filter(candidate => candidate.url() === page.url());
    // URLs disagree mid-navigation, so a lone page is taken as is; several matches are not guessed.
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
            // Swallowed so the interaction's own error stays the one the test reports.
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

                const flowResult = await flow.createFlowResult();
                // outputPath creates the directory; outputDir may not exist yet.
                const reportPath = testInfo.outputPath(FLOW_REPORT_FILE);

                writeFileSync(reportPath, generateReport(flowResult, 'html'));
                await testInfo.attach(FLOW_REPORT_FILE, {
                    path: reportPath,
                    contentType: 'text/html',
                });

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
                console.warn('[lighthouse] the flow report could not be written:', error);
            } finally {
                await browser.disconnect();
            }
        },
    };
};
