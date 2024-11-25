/* eslint-disable react-hooks/rules-of-hooks */

import { test as base, ElectronApplication, Page } from '@playwright/test';

import { DashboardActions } from './pageActions/dashboardActions';
import { launchSuite } from './common';
import { SettingsActions } from './pageActions/settingsActions';
import { SuiteGuide } from './pageActions/suiteGuideActions';
import { TopBarActions } from './pageActions/topBarActions';
import { WalletActions } from './pageActions/walletActions';

type Fixtures = {
    electronApp: ElectronApplication;
    window: Page;
    dashboardPage: DashboardActions;
    settingsPage: SettingsActions;
    suiteGuidePage: SuiteGuide;
    topBar: TopBarActions;
    walletPage: WalletActions;
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
    topBar: async ({ window }, use) => {
        const topBar = new TopBarActions(window);
        await use(topBar);
    },
    walletPage: async ({ window }, use) => {
        const walletPage = new WalletActions(window);
        await use(walletPage);
    },
});

export { test };
export { expect } from '@playwright/test';
