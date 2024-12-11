/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, ElectronApplication, Page } from '@playwright/test';

import {
    SetupEmu,
    StartEmu,
    TrezorUserEnvLink,
    TrezorUserEnvLinkClass,
} from '@trezor/trezor-user-env-link';

import { DashboardActions } from './pageActions/dashboardActions';
import { getApiUrl, getElectronVideoPath, launchSuite } from './common';
import { SettingsActions } from './pageActions/settingsActions';
import { SuiteGuide } from './pageActions/suiteGuideActions';
import { WalletActions } from './pageActions/walletActions';
import { OnboardingActions } from './pageActions/onboardingActions';
import { PlaywrightProjects } from '../playwright.config';
import { AnalyticsFixture } from './analytics';

type Fixtures = {
    startEmulator: boolean;
    emulatorStartConf: StartEmu;
    emulatorSetupConf: SetupEmu;
    apiURL: string;
    trezorUserEnvLink: TrezorUserEnvLinkClass;
    appContext: ElectronApplication | undefined;
    window: Page;
    dashboardPage: DashboardActions;
    settingsPage: SettingsActions;
    suiteGuidePage: SuiteGuide;
    walletPage: WalletActions;
    onboardingPage: OnboardingActions;
    analytics: AnalyticsFixture;
};

const test = base.extend<Fixtures>({
    startEmulator: true,
    emulatorStartConf: {},
    emulatorSetupConf: {},
    apiURL: async ({ baseURL }, use, testInfo) => {
        await use(getApiUrl(baseURL, testInfo));
    },
    /* eslint-disable-next-line no-empty-pattern */
    trezorUserEnvLink: async ({}, use) => {
        await use(TrezorUserEnvLink);
    },
    appContext: async (
        {
            trezorUserEnvLink,
            startEmulator,
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
            await trezorUserEnvLink.setupEmu(emulatorSetupConf);
        }

        if (testInfo.project.name === PlaywrightProjects.Desktop) {
            const suite = await launchSuite({
                locale,
                colorScheme,
                videoFolder: testInfo.outputDir,
            });
            await use(suite.electronApp);
            await suite.electronApp.close(); // Ensure cleanup after tests
        } else {
            if (startEmulator) {
                await trezorUserEnvLink.startBridge();
            }
            await use(undefined);
        }
    },
    window: async ({ appContext, page }, use, testInfo) => {
        if (appContext) {
            await page.close(); // Close the default chromium page
            const window = await appContext.firstWindow();
            await window.context().tracing.start({ screenshots: true, snapshots: true });
            await use(window);
            const tracePath = `${testInfo.outputDir}/trace.electron.zip`;
            await window.context().tracing.stop({ path: tracePath });
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
            await page.context().addInitScript(() => {
                // Tells the app to attach Redux Store to window object. packages/suite-web/src/support/useCypress.ts
                window.Playwright = true;
            });
            await page.goto('./');
            await use(page);
        }
    },
    dashboardPage: async ({ window }, use) => {
        const dashboardPage = new DashboardActions(window);
        await use(dashboardPage);
    },
    settingsPage: async ({ window }, use) => {
        const settingsPage = new SettingsActions(window);
        await use(settingsPage);
    },
    suiteGuidePage: async ({ window }, use) => {
        const suiteGuidePage = new SuiteGuide(window);
        await use(suiteGuidePage);
    },
    walletPage: async ({ window }, use) => {
        const walletPage = new WalletActions(window);
        await use(walletPage);
    },
    onboardingPage: async ({ window, emulatorStartConf }, use, testInfo) => {
        const onboardingPage = new OnboardingActions(
            window,
            emulatorStartConf.model ?? TrezorUserEnvLink.defaultModel,
            testInfo,
        );
        await use(onboardingPage);
    },
    analytics: async ({ window }, use) => {
        const analytics = new AnalyticsFixture(window);
        await use(analytics);
    },
});

export { test };
export { expect } from './customMatchers';
