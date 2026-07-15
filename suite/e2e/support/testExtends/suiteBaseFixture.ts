/* eslint-disable react-hooks/rules-of-hooks */

import { ElectronApplication, Page, test as base } from '@playwright/test';

import { TestAnnotationType } from '@trezor/e2e-utils';
import { SetupEmu, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { collectCoverageMap } from './coverageMapFixture';
import { getUrl, isDesktopProject } from '../common';
import { currentsTest } from './currentsFixture';
import { enhancePage } from './enhancePage';
import { PlaywrightTarget, SuiteTestOptions } from './suiteTestOptions';
import { Watcher, jsExceptionWatcher, toastErrorWatcher } from './watchers';
import { DeviceFixture } from '../device';
import { wipeAndRestartEvoluServer } from '../helpers/evoluClient';
import { electronSetup, electronTeardown, trezorUserEnvStuckProtection, webSetup } from '../setup';
import { ElectronConf, TrezorUserEnv } from '../types';

type SuiteBaseFixture = {
    wipeEvoluRelay: boolean;
    wipeEvoluRelayExecution: void;
    startEmulator: boolean;
    setupEmulator: boolean;
    deviceSetup: SetupEmu;
    electronConf: ElectronConf;
    ignoreJSExceptions: Array<string>;
    ignoreToastErrors: string[];
    device: DeviceFixture;
    url: string;
    trezorUserEnv: TrezorUserEnv;
    electronApp: ElectronApplication | undefined;
    page: Page;
    jsExceptionWatcher: Watcher | undefined;
    toastErrorWatcher: Watcher | undefined;
    coverageMapCollector: void;
};

// This is the base Suite text fixture containing all the necessary setup and core page object
// Depending on the project type (desktop or web) it will launch the appropriate environment
// and provide the necessary page object which is either electron window or web page
// Extending our fixtures from currentsTest ensures Currents fixtures initialize first and quarantine works even for fails in beforeEach section
const suiteBaseTest = currentsTest.extend<SuiteTestOptions & SuiteBaseFixture>({
    wipeEvoluRelay: false,
    wipeEvoluRelayExecution: [
        async ({ wipeEvoluRelay }, use) => {
            if (wipeEvoluRelay) {
                // Needs to happen before initializing browser/electron context
                await wipeAndRestartEvoluServer();
            }
            await use();
        },
        { auto: true },
    ],
    target: [PlaywrightTarget.Web, { option: true }],
    model: [undefined, { option: true }],
    firmwareVersion: [undefined, { option: true }],
    startEmulator: true,
    setupEmulator: true,
    deviceSetup: {},
    trezorUserEnv: async ({}, use) => {
        // This proxy limits the exposed methods from TrezorUserEnvLink and wraps the calls with test.step
        const TrezorUserEnvLinkProxy = new Proxy<TrezorUserEnv>(
            TrezorUserEnvLink as TrezorUserEnv,
            {
                get(target: any, propKey) {
                    const origMethod = target[propKey];

                    return function (...args: any[]) {
                        const params = JSON.stringify(args).slice(1, -1);
                        const methodName = String(propKey);

                        return base.step(`TrezorLink.${methodName}(${params})`, () =>
                            origMethod.apply(target, args),
                        );
                    };
                },
            },
        );
        await use(TrezorUserEnvLinkProxy);
    },
    device: [
        async (
            { startEmulator, setupEmulator, model, firmwareVersion, deviceSetup },
            use,
            testInfo,
        ) => {
            const setupPromise = (async () => {
                await TrezorUserEnvLink.logTestDetails(
                    ` - - - EXECUTING TENV CLEANUP FOR TEST ${testInfo.titlePath.join(' - ')}`,
                );
                await TrezorUserEnvLink.stopBridge();
                await TrezorUserEnvLink.stopEmu();
                await TrezorUserEnvLink.connect();
                await TrezorUserEnvLink.logTestDetails(
                    ` - - - TENV CLEANUP COMPLETED FOR TEST ${testInfo.titlePath.join(' - ')}`,
                );
            })();

            await base.step('Device environment cleanup', async () => {
                await trezorUserEnvStuckProtection(setupPromise);
            });

            if (!model || !firmwareVersion) {
                await use(
                    new Proxy({} as DeviceFixture, {
                        get(_target, prop) {
                            throw new Error(
                                `"device" fixture is unavailable: this test set no model/firmwareVersion. ` +
                                    `Tag it with a device model before using device.${String(prop)}.`,
                            );
                        },
                    }),
                );

                return;
            }
            testInfo.annotations.push({
                type: TestAnnotationType.DeviceModel,
                description: model,
            });

            const device = new DeviceFixture(model, firmwareVersion);

            const startDevicePromise = (async () => {
                await TrezorUserEnvLink.logTestDetails(
                    ` - - - STARTING TEST ${testInfo.titlePath.join(' - ')}`,
                );
                if (startEmulator) {
                    await device.powerOn({ wipe: true });
                }

                if (startEmulator && setupEmulator) {
                    await device.setup(deviceSetup);
                }
            })();

            await base.step('Device startup', async () => {
                await trezorUserEnvStuckProtection(startDevicePromise);
            });

            await use(device);

            await base.step('Logging test-end to Device logs', async () => {
                await trezorUserEnvStuckProtection(
                    (async () => {
                        await TrezorUserEnvLink.logTestDetails(
                            ` - - - FINISHING TEST ${testInfo.titlePath.join(' - ')}`,
                        );
                    })(),
                );
            });
        },
        { auto: true },
    ],
    electronConf: {},
    ignoreJSExceptions: [],
    ignoreToastErrors: [],

    url: async ({ target }, use, testInfo) => {
        await use(getUrl(testInfo, target));
    },

    electronApp: async ({ target, locale, colorScheme, electronConf }, use, testInfo) => {
        if (isDesktopProject(target)) {
            const suite = await electronSetup(testInfo, locale, colorScheme, electronConf);
            await use(suite.electronApp);
            await electronTeardown(suite, testInfo, electronConf);
        } else {
            await use(undefined);
        }
    },

    page: async ({ target, context, electronApp }, use) => {
        if (isDesktopProject(target)) {
            const window = await electronApp!.firstWindow();
            enhancePage(window);
            await use(window);
        } else {
            const page = await webSetup(context);
            enhancePage(page);
            await use(page);
        }
    },

    jsExceptionWatcher: [jsExceptionWatcher, { auto: true }],

    toastErrorWatcher: [toastErrorWatcher, { auto: true }],

    coverageMapCollector: [
        async ({ page }, use, testInfo) => {
            await use();
            await collectCoverageMap(page, testInfo);
        },
        { auto: true },
    ],
});

// Stopping our watchers right after test, so we don't collect irrelevant errors caused by teardown phase
suiteBaseTest.afterEach(
    async ({ jsExceptionWatcher: jsWatcher, toastErrorWatcher: toastWatcher }) => {
        await suiteBaseTest.step('Stopping watchers', () => {
            jsWatcher?.stop();
            toastWatcher?.stop();
        });
    },
);

export { suiteBaseTest };
