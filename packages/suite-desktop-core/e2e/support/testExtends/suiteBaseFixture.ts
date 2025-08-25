/* eslint-disable react-hooks/rules-of-hooks */
import { BrowserContext, Page, TestInfo, test as base } from '@playwright/test';

import { TestAnnotationType } from '@trezor/e2e-utils';
import {
    MODELS,
    Model,
    SetupEmu,
    StartEmu,
    TrezorUserEnvLinkClass,
} from '@trezor/trezor-user-env-link';

import {
    TrezorUserEnvLinkProxy,
    getUrl,
    getVideoPath,
    isDesktopProject,
    mockRemoteMessageSystem,
} from '../common';
import { LaunchSuiteParams, Suite, launchSuite } from '../electron';
import { enhancePage } from './enhancePage';

type StartEmuModelRequired = StartEmu & { model: Model };

type ElectronConf = Pick<LaunchSuiteParams, 'keepUserData' | 'bridgeDaemon' | 'exposeConnectWs'>;

type suiteBaseFixture = {
    startEmulator: boolean;
    setupEmulator: boolean;
    emulatorStartConf: StartEmuModelRequired;
    emulatorSetupConf: SetupEmu;
    electronConf: ElectronConf;
    ignoreJSExceptions: Array<string>;
    url: string;
    trezorUserEnvLink: TrezorUserEnvLinkClass;
    page: Page;
    exceptionLogger: void;
};

const electronSetup = async (
    testInfo: TestInfo,
    locale: string | undefined,
    colorScheme: any,
    electronConf: ElectronConf,
) => {
    const suite = await launchSuite({
        locale,
        colorScheme,
        artefactFolder: testInfo.outputDir,
        viewport: testInfo.project.use.viewport!,
        ...electronConf,
    });

    await suite.window
        .context()
        .tracing.start({ screenshots: true, snapshots: true, sources: true });

    return suite;
};

const electronTeardown = async (suite: Suite, testInfo: TestInfo, electronConf: ElectronConf) => {
    const tracePath = `${testInfo.outputDir}/trace.electron.zip`;
    await suite.window.context().tracing.stop({ path: tracePath });
    testInfo.attachments.push({
        name: 'electron-logs.txt',
        path: `${testInfo.outputDir}/electron-logs.txt`,
        contentType: 'text/plain',
    });
    testInfo.attachments.push({
        name: 'trace',
        path: tracePath,
        contentType: 'application/zip',
    });
    const videoPath = getVideoPath(testInfo.outputDir);
    if (videoPath) {
        testInfo.attachments.push({
            name: 'video',
            path: videoPath,
            contentType: 'video/webm',
        });
    }
    const closePromise = suite.electronApp.close();
    // Handle modal that asks to enable auto-start
    if (electronConf.exposeConnectWs) {
        await suite.window.getByTestId('@auto-start-before-quit/button-quit').click();
    }
    await closePromise;
};

const webSetup = async (browserContext: BrowserContext) => {
    await TrezorUserEnvLinkProxy.startBridge();
    const page = await browserContext.newPage();
    // Tells the app to attach Redux Store to window object. packages/suite-web/src/support/usePlaywright.ts
    // Which is needed for methods manupalating Redux store like onboardingPage.disableFirmwareHashCheck
    await page.context().addInitScript(() => {
        window.Playwright = true;
    });
    await page.goto('./');
    await mockRemoteMessageSystem(page);

    return page;
};

const webTeardown = async (page: Page, browserContext: BrowserContext, testInfo: TestInfo) => {
    await page.close();
    await browserContext.close();
    const videoPath = getVideoPath(testInfo.outputDir);
    if (videoPath) {
        testInfo.attachments.push({
            name: 'video',
            path: videoPath,
            contentType: 'video/webm',
        });
    }
};

const trezorEnvSetup = async (
    testInfo: TestInfo,
    startEmulator: boolean,
    setupEmulator: boolean,
    emulatorStartConf: StartEmu,
    emulatorSetupConf: SetupEmu,
) => {
    await TrezorUserEnvLinkProxy.logTestDetails(
        ` - - - STARTING TEST ${testInfo.titlePath.join(' - ')}`,
    );
    // This test annotation is used by our GitHub reporter
    testInfo.annotations.push({
        type: TestAnnotationType.DeviceModel,
        description: emulatorStartConf.model,
    });
    // We cannot rely on that previous teardown was done correctly
    await TrezorUserEnvLinkProxy.stopBridge();
    await TrezorUserEnvLinkProxy.stopEmu();
    await TrezorUserEnvLinkProxy.connect();
    if (startEmulator) {
        await TrezorUserEnvLinkProxy.startEmu(emulatorStartConf);
    }
    if (startEmulator && setupEmulator) {
        await TrezorUserEnvLinkProxy.setupEmu(emulatorSetupConf);
    }
};

function getModelFromEnv(): Model {
    const envValue = process.env.EMULATOR_MODEL as Model;

    return MODELS.includes(envValue) ? envValue : 'T3T1';
}

// This is the base Suite text fixture containing all the necessary setup and core page object
// Depending on the project type (desktop or web) it will launch the appropriate environment
// and provide the necessary page object which is either electron window or web page
const suiteBaseTest = base.extend<suiteBaseFixture>({
    startEmulator: true,
    setupEmulator: true,
    emulatorStartConf: { model: getModelFromEnv(), wipe: true },
    emulatorSetupConf: {},
    electronConf: {},
    ignoreJSExceptions: [],

    url: async ({}, use, testInfo) => {
        await use(getUrl(testInfo));
    },

    trezorUserEnvLink: async ({}, use) => {
        await use(TrezorUserEnvLinkProxy);
    },
    page: async (
        {
            locale,
            colorScheme,
            browser,
            startEmulator,
            setupEmulator,
            emulatorStartConf,
            emulatorSetupConf,
            electronConf,
        },
        use,
        testInfo,
    ) => {
        // This Trezor env setup needs to happen before electron or web page are launched
        await trezorEnvSetup(
            testInfo,
            startEmulator,
            setupEmulator,
            emulatorStartConf,
            emulatorSetupConf,
        );

        if (isDesktopProject(testInfo)) {
            const suite = await electronSetup(testInfo, locale, colorScheme, electronConf);
            enhancePage(suite.window);
            await use(suite.window);
            await electronTeardown(suite, testInfo, electronConf);
        } else {
            const browserContext = await browser.newContext({
                recordVideo: {
                    dir: testInfo.outputPath(),
                },
            });
            const page = await webSetup(browserContext);
            enhancePage(page);
            await use(page);
            await webTeardown(page, browserContext, testInfo);
        }

        await TrezorUserEnvLinkProxy.logTestDetails(
            ` - - - FINISHING TEST ${testInfo.titlePath.join(' - ')}`,
        );
    },
    exceptionLogger: [
        async ({ page, ignoreJSExceptions }, use, testInfo) => {
            const errors: Error[] = [];
            const ignored: Error[] = [];
            page.on('pageerror', error => {
                if (ignoreJSExceptions.some(exception => error.message.includes(exception))) {
                    ignored.push(error);
                } else {
                    errors.push(error);
                }
            });

            await use();

            if (ignored.length > 0) {
                testInfo.annotations.push({
                    type: 'Warning, Ignored JS exceptions',
                    description: `\n${ignored.map(error => `${error.message}\n${error.stack}`).join('\n-----\n')}`,
                });
            }

            if (errors.length > 0) {
                throw new Error(
                    `There was a JS exception during test run.
                    \n${errors.map(error => `${error.message}\n${error.stack}`).join('\n-----\n')}`,
                );
            }
        },
        { auto: true },
    ],
});

export { suiteBaseTest };
