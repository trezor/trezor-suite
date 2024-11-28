/* eslint-disable react-hooks/rules-of-hooks */

import { test as base, ElectronApplication, Page } from '@playwright/test';

import { DashboardActions } from './pageActions/dashboardActions';
import { launchSuite } from './common';
import { SettingsActions } from './pageActions/settingsActions';
import { SuiteGuide } from './pageActions/suiteGuideActions';
import { WalletActions } from './pageActions/walletActions';
import { OnboardingActions } from './pageActions/onboardingActions';

type Fixtures = {
    electronApp: ElectronApplication;
    window: Page;
    dashboardPage: DashboardActions;
    settingsPage: SettingsActions;
    suiteGuidePage: SuiteGuide;
    walletPage: WalletActions;
    onboardingPage: OnboardingActions;
};

const test = base.extend<Fixtures>({
    /* eslint-disable no-empty-pattern */
    electronApp: async ({}, use) => {
        const suite = await launchSuite();
        await use(suite.electronApp);
        await suite.electronApp.close(); // Ensure cleanup after tests
    },
    window: async ({ electronApp }, use, testInfo) => {
        const window = await electronApp.firstWindow();
        await window.context().tracing.start({ screenshots: true, snapshots: true });
        await use(window);
        const tracePath = `${testInfo.outputDir}/trace.electron.zip`;
        await window.context().tracing.stop({ path: tracePath });
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
