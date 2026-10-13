import { ElectronApplication, Page, TestInfo } from '@playwright/test';
import { readFileSync, writeFileSync } from 'fs';
import type { Flags, startFlow } from 'lighthouse';
import path from 'path';
import type { Browser, Page as BrowserPage, ConnectOptions } from 'puppeteer-core';

import { buildFlowDocument, resolvePlatform } from '@trezor/perf-e2e';

import {
    LIGHTHOUSE_PROFILED_ANNOTATION,
    LighthouseMode,
    getLighthouseDebugPort,
    getLighthouseMode,
} from './lighthouseConfig';
import { writeFlowDocument } from './perfHistory';

/**
 * Lighthouse timespans around a Playwright test's interactions, stored as a flow result. Never
 * gates a test, including when Lighthouse itself fails. See docs/tests/perf-history.md.
 * @see https://github.com/GoogleChrome/lighthouse/blob/main/docs/user-flows.md#timespan
 *
 * Attaches through `puppeteer-core`: Lighthouse needs wildcard CDP events, `session.id()` and
 * `sessionattached`, which Playwright's CDPSession does not expose. Both are imported only once a
 * flow starts, so test processes that never profile do not load them.
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

const attachLighthouseFlow = async ({
    page,
    electronApp,
    testInfo,
    mode,
}: StartLighthouseFlowParams): Promise<LighthouseFlow> => {
    const [lighthouse, { connect }] = await Promise.all([
        import('lighthouse'),
        import('puppeteer-core'),
    ]);
    const browser = await connect({
        ...(await resolveEndpoint(electronApp)),
        defaultViewport: null,
    });

    let flow: Awaited<ReturnType<typeof startFlow>>;
    try {
        const pageUnderTest = await findPageUnderTest(browser, page);

        if (!pageUnderTest) {
            await browser.disconnect();

            return passthroughFlow;
        }

        flow = await lighthouse.startFlow(pageUnderTest, {
            name: testInfo.title,
            flags: AS_IS_FLAGS,
        });
    } catch (error) {
        await browser.disconnect().catch(() => {});
        throw error;
    }

    let recordedSteps = 0;
    // Lighthouse keeps a timespan open when ending it fails, so every later start would throw.
    let isBroken = false;

    const markProfiled = (scenario?: string) =>
        testInfo.annotations.push({
            type: LIGHTHOUSE_PROFILED_ANNOTATION,
            ...(mode === LighthouseMode.Steps ? { description: scenario } : {}),
        });

    const timespan = async <T>(name: string, interaction: () => Promise<T>): Promise<T> => {
        if (isBroken) {
            return interaction();
        }

        try {
            await flow.startTimespan({ name });
        } catch (error) {
            isBroken = true;
            console.warn(
                `[lighthouse] step "${name}" could not start, so it runs untraced:`,
                error,
            );

            return interaction();
        }

        markProfiled(name);
        let hasCompleted = false;

        try {
            const result = await interaction();
            hasCompleted = true;

            return result;
        } finally {
            // Swallowed so the interaction's own error stays the one the test reports.
            await flow.endTimespan().then(
                () => {
                    if (hasCompleted) {
                        recordedSteps += 1;
                    }
                },
                (error: unknown) => {
                    isBroken = true;
                    console.warn(`[lighthouse] step "${name}" was not recorded:`, error);
                },
            );
        }
    };

    return {
        timespan,

        finish: async () => {
            try {
                // A failed test's steps may hold a timed-out or broken interaction.
                if (recordedSteps === 0 || testInfo.status !== testInfo.expectedStatus) {
                    return;
                }

                const flowResult = await flow.createFlowResult();
                // outputPath creates the directory; outputDir may not exist yet.
                const reportPath = testInfo.outputPath(FLOW_REPORT_FILE);

                writeFileSync(reportPath, lighthouse.generateReport(flowResult, 'html'));
                await testInfo.attach(FLOW_REPORT_FILE, {
                    path: reportPath,
                    contentType: 'text/html',
                });

                const platform = resolvePlatform(process.env.PERF_PLATFORM);

                if (platform) {
                    writeFlowDocument(
                        buildFlowDocument({
                            platform,
                            model: testInfo.project.name,
                            title: testInfo.title,
                            titlePath: testInfo.titlePath,
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

/** Falls back to an untraced test: an infrastructure fault must not decide a test's verdict. */
export const startLighthouseFlow = async (
    params: StartLighthouseFlowParams,
): Promise<LighthouseFlow> => {
    if (getLighthouseMode() !== params.mode) {
        return passthroughFlow;
    }

    try {
        return await attachLighthouseFlow(params);
    } catch (error) {
        console.warn(
            '[lighthouse] could not attach to the app under test, so this test is not profiled:',
            error,
        );

        return passthroughFlow;
    }
};
