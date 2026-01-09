/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable jest/no-commented-out-tests */
import { BrowserContext, Page, TestInfo, test as base } from '@playwright/test';
import { execSync } from 'child_process';

import { TestAnnotationType } from '@trezor/e2e-utils';
import { Model, SetupEmu, StartEmu, TrezorUserEnvLinkClass } from '@trezor/trezor-user-env-link';

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

type StartEmuModelRequired = StartEmu & { model: Model };

type ElectronConf = Pick<LaunchSuiteParams, 'keepUserData' | 'bridgeDaemon' | 'exposeConnectWs'>;

type suiteBaseFixture = {
    startEmulator: boolean;
    setupEmulator: boolean;
    emulatorStartConf: StartEmuModelRequired;
    emulatorStartConfFinalizer: void;
    emulatorSetupConf: SetupEmu;
    electronConf: ElectronConf;
    ignoreJSExceptions: Array<string>;
    url: string;
    trezorUserEnvLink: TrezorUserEnvLinkClass;
    page: Page;
    exceptionLogger: void;
    model: Model;
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
    await TrezorUserEnvLinkProxy.startBridge(BRIDGE_VERSION);

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

const getDefaultFirmwareVersion = (model: Model): string => {
    const DefaultFirmwareMajorVersion = model === 'T1B1' ? 1 : 2;
    const defaultFirmwareType = process.env.CANARY_FIRMWARE ? '-main' : '-latest';

    return `${DefaultFirmwareMajorVersion}${defaultFirmwareType}`;
};

// Gives trezorUserEnv promise a 30s to complete, else restart tenv to recover from potential hangs
export const trezorUserEnvStuckProtection = async (promise: Promise<any>) => {
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

const trezorEnvSetup = async (
    testInfo: TestInfo,
    startEmulator: boolean,
    setupEmulator: boolean,
    emulatorStartConf: StartEmu,
    emulatorSetupConf: SetupEmu,
) => {
    const setupPromise = (async () => {
        await TrezorUserEnvLinkProxy.logTestDetails(
            ` - - - STARTING TEST ${testInfo.titlePath.join(' - ')}`,
        );
        testInfo.annotations.push({
            type: TestAnnotationType.DeviceModel,
            description: emulatorStartConf.model,
        });
        await TrezorUserEnvLinkProxy.stopBridge();
        await TrezorUserEnvLinkProxy.stopEmu();
        await TrezorUserEnvLinkProxy.connect();

        if (startEmulator) {
            await TrezorUserEnvLinkProxy.startEmu(emulatorStartConf);
        }
        if (startEmulator && setupEmulator) {
            await TrezorUserEnvLinkProxy.setupEmu(emulatorSetupConf);
        }
    })();

    await trezorUserEnvStuckProtection(setupPromise);
};

// This is the base Suite text fixture containing all the necessary setup and core page object
// Depending on the project type (desktop or web) it will launch the appropriate environment
// and provide the necessary page object which is either electron window or web page
// Extending our fixtures from currentsTest ensures Currents fixtures initialize first and quarantine works even for fails in beforeEach section
const suiteBaseTest = currentsTest.extend<suiteBaseFixture>({
    startEmulator: true,
    setupEmulator: true,
    model: async ({}, use, testInfo) => {
        if (!testInfo.project.use.model) {
            throw new Error('Model is not defined in project.use');
        }
        await use(testInfo.project.use.model);
    },
    emulatorStartConf: async ({ model }, use) => {
        await use({ model, wipe: true });
    },
    // emulatorStartConf override from test file:
    //   test.use({emulatorStartConf: { model: 'T1B1', wipe: true }});
    // can lack version and it needs to be finalized based on model and CANARY_FIRMWARE env var
    emulatorStartConfFinalizer: [
        async ({ emulatorStartConf }, use) => {
            if (!emulatorStartConf.version) {
                emulatorStartConf.version = getDefaultFirmwareVersion(emulatorStartConf.model);
            }
            await use();
        },
        { auto: true },
    ],
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
            context,
            startEmulator,
            setupEmulator,
            emulatorStartConf,
            emulatorSetupConf,
            electronConf,
        },
        use,
        testInfo,
    ) => {
        await base.step(`TrezorUserEnv setup`, async () => {
            // This Trezor env setup needs to happen before electron or web page are launched
            await trezorEnvSetup(
                testInfo,
                startEmulator,
                setupEmulator,
                emulatorStartConf,
                emulatorSetupConf,
            );
        });

        if (isDesktopProject(testInfo)) {
            const suite = await electronSetup(testInfo, locale, colorScheme, electronConf);
            enhancePage(suite.window);
            await use(suite.window);
            await electronTeardown(suite, testInfo, electronConf);
        } else {
            const page = await webSetup(context);
            enhancePage(page);
            await use(page);
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
