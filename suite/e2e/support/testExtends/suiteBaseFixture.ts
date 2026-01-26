/* eslint-disable react-hooks/rules-of-hooks */

import { BrowserContext, Page, TestInfo } from '@playwright/test';
import { execSync } from 'child_process';

import { TestAnnotationType } from '@trezor/e2e-utils';
import { SetupEmu, TrezorUserEnvLink, TrezorUserEnvLinkClass } from '@trezor/trezor-user-env-link';

import {
    TrezorUserEnvLinkProxy,
    getUrl,
    getVideoPath,
    isDesktopProject,
    mockRemoteMessageSystem,
} from '../common';
import { LaunchSuiteParams, Suite, launchSuite } from '../electron';
import { currentsTest } from './currentsFixture';
import { enhancePage } from './enhancePage';
import { BRIDGE_VERSION } from '../bridge';
import { PlaywrightTarget, SuiteTestOptions } from './suiteTestOptions';
import { DeviceFixture } from '../device';

type ElectronConf = Pick<LaunchSuiteParams, 'keepUserData' | 'bridgeDaemon' | 'exposeConnectWs'>;

type SuiteBaseFixture = {
    startEmulator: boolean;
    setupEmulator: boolean;
    deviceSetup: SetupEmu;
    device: DeviceFixture;
    electronConf: ElectronConf;
    ignoreJSExceptions: Array<string>;
    url: string;
    /** @deprecated */
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

    await mockRemoteMessageSystem(suite.window);

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
    await TrezorUserEnvLink.startBridge(BRIDGE_VERSION);

    // Need to allow this to be able to access bridge on localhost
    // When running tests against suite deployed elsewhere
    if (browserContext.browser()?.browserType().name() === 'chromium') {
        await browserContext.grantPermissions(['local-network-access']);
    }

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

// Gives trezorUserEnv promise a 30s to complete, else restart tenv to recover from potential hangs
const trezorUserEnvStuckProtection = async (promise: Promise<any>) => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise(
        (_, reject) =>
            (timeoutId = setTimeout(() => {
                if (process.env.COMPOSE_FILE) {
                    execSync('docker compose restart trezor-user-env-unix', { cwd: '../../' }); // restart tenv to fix potential hangs
                }
                reject(new Error('TrezorUserEnv action timed out'));
            }, 30_000)),
    );

    const promiseWithClearingTimeout = async () => {
        await promise;
        clearTimeout(timeoutId);
    };

    await Promise.race([promiseWithClearingTimeout(), timeoutPromise]);
};

// This is the base Suite text fixture containing all the necessary setup and core page object
// Depending on the project type (desktop or web) it will launch the appropriate environment
// and provide the necessary page object which is either electron window or web page
// Extending our fixtures from currentsTest ensures Currents fixtures initialize first and quarantine works even for fails in beforeEach section
const suiteBaseTest = currentsTest.extend<SuiteTestOptions & SuiteBaseFixture>({
    target: [PlaywrightTarget.Web, { option: true }],
    model: [undefined, { option: true }],
    firmwareVersion: [undefined, { option: true }],
    startEmulator: true,
    setupEmulator: true,
    deviceSetup: {},
    device: [
        async (
            { startEmulator, setupEmulator, model, firmwareVersion, deviceSetup },
            use,
            testInfo,
        ) => {
            await TrezorUserEnvLink.logTestDetails(
                ` - - - EXECUTING TENV CLEANUP FOR TEST ${testInfo.titlePath.join(' - ')}`,
            );
            const setupPromise = (async () => {
                await TrezorUserEnvLink.stopBridge();
                await TrezorUserEnvLink.stopEmu();
                await TrezorUserEnvLink.connect();
            })();

            await trezorUserEnvStuckProtection(setupPromise);

            await TrezorUserEnvLink.logTestDetails(
                ` - - - TENV CLEANUP COMPLETED FOR TEST ${testInfo.titlePath.join(' - ')}`,
            );

            if (!model || !firmwareVersion) {
                await use(undefined as unknown as DeviceFixture);

                return;
            }
            await TrezorUserEnvLink.logTestDetails(
                ` - - - STARTING TEST ${testInfo.titlePath.join(' - ')}`,
            );
            testInfo.annotations.push({
                type: TestAnnotationType.DeviceModel,
                description: model,
            });

            const device = new DeviceFixture(model, firmwareVersion);

            if (startEmulator) {
                await device.powerOn({ wipe: true });
            }

            if (startEmulator && setupEmulator) {
                await device.setup(deviceSetup);
            }

            await use(device);

            await TrezorUserEnvLink.logTestDetails(
                ` - - - FINISHING TEST ${testInfo.titlePath.join(' - ')}`,
            );
        },
        { auto: true },
    ],
    electronConf: {},
    ignoreJSExceptions: [],

    url: async ({ target }, use, testInfo) => {
        await use(getUrl(testInfo, target));
    },

    trezorUserEnvLink: async ({}, use) => {
        await use(TrezorUserEnvLinkProxy);
    },
    page: async ({ target, locale, colorScheme, context, electronConf }, use, testInfo) => {
        if (isDesktopProject(target)) {
            const suite = await electronSetup(testInfo, locale, colorScheme, electronConf);
            enhancePage(suite.window);
            await use(suite.window);
            await electronTeardown(suite, testInfo, electronConf);
        } else {
            const page = await webSetup(context);
            enhancePage(page);
            await use(page);
        }
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
