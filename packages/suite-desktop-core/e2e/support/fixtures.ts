/* eslint-disable react-hooks/rules-of-hooks */

import { test as base, ElectronApplication, Page } from '@playwright/test';

import { TrezorUserEnvLink, TrezorUserEnvLinkClass } from '@trezor/trezor-user-env-link';

import { DashboardActions } from './pageActions/dashboardActions';
import { launchSuite } from './common';
import { SettingsActions } from './pageActions/settingsActions';
import { SuiteGuide } from './pageActions/suiteGuideActions';
import { WalletActions } from './pageActions/walletActions';
import { OnboardingActions } from './pageActions/onboardingActions';
import { PlaywrightProjects } from '../playwright.config';

type Fixtures = {
    startEmulator: boolean;
    emulatorConf: {
        needs_backup: boolean;
        mnemonic: string;
    };
    trezorUserEnvLink: TrezorUserEnvLinkClass;
    appContext: ElectronApplication | undefined;
    window: Page;
    dashboardPage: DashboardActions;
    settingsPage: SettingsActions;
    suiteGuidePage: SuiteGuide;
    walletPage: WalletActions;
    onboardingPage: OnboardingActions;
};

const test = base.extend<Fixtures>({
    startEmulator: true,
    emulatorConf: {
        needs_backup: true,
        mnemonic: 'mnemonic_all',
    },
    /* eslint-disable-next-line no-empty-pattern */
    trezorUserEnvLink: async ({}, use) => {
        await use(TrezorUserEnvLink);
    },
    appContext: async (
        { trezorUserEnvLink, startEmulator, emulatorConf, locale, colorScheme },
        use,
        testInfo,
    ) => {
        // We need to ensure emulator is running before launching the suite
        if (startEmulator) {
            await trezorUserEnvLink.stopBridge();
            await trezorUserEnvLink.stopEmu();
            await trezorUserEnvLink.connect();
            await trezorUserEnvLink.startEmu({ wipe: true });
            await trezorUserEnvLink.setupEmu(emulatorConf);
        }

        if (testInfo.project.name === PlaywrightProjects.Desktop) {
            const suite = await launchSuite({ locale, colorScheme });
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
            const window = await appContext.firstWindow();
            await window.context().tracing.start({ screenshots: true, snapshots: true });
            await use(window);
            const tracePath = `${testInfo.outputDir}/trace.electron.zip`;
            await window.context().tracing.stop({ path: tracePath });
        } else {
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
    onboardingPage: async ({ window }, use) => {
        const onboardingPage = new OnboardingActions(window);
        await use(onboardingPage);
    },
});

export { test };
export { expect } from '@playwright/test';
