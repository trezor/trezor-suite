/* eslint-disable react-hooks/rules-of-hooks */
import { Page, test as base } from '@playwright/test';

import { Model, SetupEmu, StartEmu, TrezorUserEnvLinkClass } from '@trezor/trezor-user-env-link';

import { AnalyticsFixture } from './analytics';
import {
    TrezorUserEnvLinkProxy,
    getElectronVideoPath,
    getUrl,
    isDesktopProject,
    launchSuite,
} from './common';
import { IndexedDbFixture } from './indexedDb';
import { BlockbookMock } from './mocks/blockBookMock';
import { MetadataProviderMock } from './mocks/metadataProviderMock';
import { AnalyticsActions } from './pageActions/analyticsActions';
import { AssetsActions } from './pageActions/assetsActions';
import { DashboardActions } from './pageActions/dashboardActions';
import { DevicePromptActions } from './pageActions/devicePromptActions';
import { MarketActions } from './pageActions/marketActions';
import { MetadataActions } from './pageActions/metadata/metadataActions';
import { OnboardingActions } from './pageActions/onboarding/onboardingActions';
import { RecoveryActions } from './pageActions/recoveryActions';
import { SettingsActions } from './pageActions/settings/settingsActions';
import { SuiteGuide } from './pageActions/suiteGuideActions';
import { TrezorInputActions } from './pageActions/trezorInputActions';
import { WalletActions } from './pageActions/walletActions';

type StartEmuModelRequired = StartEmu & { model: Model };

type Fixtures = {
    startEmulator: boolean;
    setupEmulator: boolean;
    emulatorStartConf: StartEmuModelRequired;
    emulatorSetupConf: SetupEmu;
    url: string;
    trezorUserEnvLink: TrezorUserEnvLinkClass;
    electronWindow: Page | undefined;
    page: Page;
    dashboardPage: DashboardActions;
    settingsPage: SettingsActions;
    suiteGuidePage: SuiteGuide;
    walletPage: WalletActions;
    onboardingPage: OnboardingActions;
    analyticsPage: AnalyticsActions;
    devicePrompt: DevicePromptActions;
    recoveryPage: RecoveryActions;
    marketPage: MarketActions;
    assetsPage: AssetsActions;
    metadataPage: MetadataActions;
    trezorInput: TrezorInputActions;
    analytics: AnalyticsFixture;
    indexedDb: IndexedDbFixture;
    metadataProviderMock: MetadataProviderMock;
    blockbookMock: BlockbookMock;
    exceptionLogger: void;
};

const test = base.extend<Fixtures>({
    startEmulator: true,
    setupEmulator: true,
    emulatorStartConf: { model: 'T3T1', wipe: true },
    emulatorSetupConf: {},
    /* eslint-disable-next-line no-empty-pattern */
    url: async ({}, use, testInfo) => {
        await use(getUrl(testInfo));
    },
    /* eslint-disable-next-line no-empty-pattern */
    trezorUserEnvLink: async ({}, use) => {
        await use(TrezorUserEnvLinkProxy);
    },
    electronWindow: async (
        {
            trezorUserEnvLink,
            startEmulator,
            setupEmulator,
            emulatorStartConf,
            emulatorSetupConf,
            locale,
            colorScheme,
        },
        use,
        testInfo,
    ) => {
        // We need to ensure emulator is running before launching the suite
        if (startEmulator) {
            await trezorUserEnvLink.stopBridge();
            await trezorUserEnvLink.stopEmu();
            await trezorUserEnvLink.connect();
            await trezorUserEnvLink.startEmu(emulatorStartConf);
        }

        if (startEmulator && setupEmulator) {
            await trezorUserEnvLink.setupEmu(emulatorSetupConf);
        }

        if (isDesktopProject(testInfo)) {
            const suite = await launchSuite({
                locale,
                colorScheme,
                videoFolder: testInfo.outputDir,
                viewport: testInfo.project.use.viewport!,
            });
            await use(suite.window);
            await suite.electronApp.close(); // Ensure cleanup after tests
        } else {
            if (startEmulator) {
                await trezorUserEnvLink.startBridge();
            }
            await use(undefined);
        }
    },
    page: async ({ electronWindow, page: webPage }, use, testInfo) => {
        if (electronWindow) {
            await webPage.close(); // Close the default chromium page
            await electronWindow.context().tracing.start({ screenshots: true, snapshots: true });
            await use(electronWindow);
            const tracePath = `${testInfo.outputDir}/trace.electron.zip`;
            await electronWindow.context().tracing.stop({ path: tracePath });
            testInfo.attachments.push({
                name: 'trace',
                path: tracePath,
                contentType: 'application/zip',
            });
            testInfo.attachments.push({
                name: 'video',
                path: getElectronVideoPath(testInfo.outputDir),
                contentType: 'video/webm',
            });
        } else {
            await webPage.context().addInitScript(() => {
                // Tells the app to attach Redux Store to window object. packages/suite-web/src/support/useCypress.ts
                window.Playwright = true;
            });
            await webPage.goto('./');
            await use(webPage);
        }
    },
    dashboardPage: async ({ page, devicePrompt }, use) => {
        const dashboardPage = new DashboardActions(page, devicePrompt);
        await use(dashboardPage);
    },
    settingsPage: async ({ page, url }, use) => {
        const settingsPage = new SettingsActions(page, url);
        await use(settingsPage);
    },
    suiteGuidePage: async ({ page }, use) => {
        const suiteGuidePage = new SuiteGuide(page);
        await use(suiteGuidePage);
    },
    walletPage: async ({ page }, use) => {
        const walletPage = new WalletActions(page);
        await use(walletPage);
    },
    onboardingPage: async (
        { page, analyticsPage, devicePrompt, emulatorStartConf },
        use,
        testInfo,
    ) => {
        const onboardingPage = new OnboardingActions(
            page,
            analyticsPage,
            devicePrompt,
            emulatorStartConf.model,
            testInfo,
        );
        await use(onboardingPage);
    },
    analyticsPage: async ({ page }, use) => {
        const analyticsPage = new AnalyticsActions(page);
        await use(analyticsPage);
    },
    devicePrompt: async ({ page }, use) => {
        const devicePromptActions = new DevicePromptActions(page);
        await use(devicePromptActions);
    },
    recoveryPage: async ({ page }, use) => {
        const recoveryPage = new RecoveryActions(page);
        await use(recoveryPage);
    },
    marketPage: async ({ page }, use) => {
        const marketPage = new MarketActions(page);
        await use(marketPage);
    },
    assetsPage: async ({ page }, use) => {
        const assetPage = new AssetsActions(page);
        await use(assetPage);
    },
    metadataPage: async ({ page, devicePrompt }, use) => {
        const metadataPage = new MetadataActions(page, devicePrompt);
        await use(metadataPage);
    },
    trezorInput: async ({ page }, use) => {
        const trezorInput = new TrezorInputActions(page);
        await use(trezorInput);
    },
    analytics: async ({ page }, use) => {
        const analytics = new AnalyticsFixture(page);
        await use(analytics);
    },
    indexedDb: async ({ page }, use) => {
        const indexedDb = new IndexedDbFixture(page);
        await use(indexedDb);
    },
    metadataProviderMock: async ({ page }, use) => {
        const metadataProviderMock = new MetadataProviderMock(page);
        await use(metadataProviderMock);
    },
    /* eslint-disable-next-line no-empty-pattern */
    blockbookMock: async ({}, use) => {
        const blockbookMock = new BlockbookMock();
        await use(blockbookMock);
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

export { test };
export { expect } from './customMatchers';
