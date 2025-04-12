/* eslint-disable react-hooks/rules-of-hooks */
import { BrowserContext, Page, TestInfo, test as base } from '@playwright/test';

import { Model, SetupEmu, StartEmu, TrezorUserEnvLinkClass } from '@trezor/trezor-user-env-link';

import { TrezorUserEnvLinkProxy, getUrl, getVideoPath, isDesktopProject } from '../common';
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

const electronTeardown = async (suite: Suite, testInfo: TestInfo) => {
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
    testInfo.attachments.push({
        name: 'video',
        path: getVideoPath(testInfo.outputDir),
        contentType: 'video/webm',
    });
    await suite.electronApp.close();
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

    return page;
};

const webTeardown = async (page: Page, browserContext: BrowserContext, testInfo: TestInfo) => {
    await page.close();
    await browserContext.close();
    testInfo.attachments.push({
        name: 'video',
        path: getVideoPath(testInfo.outputDir),
        contentType: 'video/webm',
    });
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

// This is the base Suite text fixture containing all the necessary setup and core page object
// Depending on the project type (desktop or web) it will launch the appropriate environment
// and provide the necessary page object which is either electron window or web page
const suiteBaseTest = base.extend<suiteBaseFixture>({
    startEmulator: true,
    setupEmulator: true,
    emulatorStartConf: { model: 'T3T1', wipe: true },
    emulatorSetupConf: {},
    electronConf: {},
    /* eslint-disable-next-line no-empty-pattern */
    url: async ({}, use, testInfo) => {
        await use(getUrl(testInfo));
    },
    /* eslint-disable-next-line no-empty-pattern */
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
            await electronTeardown(suite, testInfo);
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
        async ({ page }, use) => {
            const errors: Error[] = [];
            page.on('pageerror', error => {
                errors.push(error);
            });

            await use();

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
