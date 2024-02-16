import { test as testPlaywright, ElectronApplication, Page } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link/src';

import { launchSuite, rmDirRecursive } from '../../support/common';
import { onDashboardPage } from '../../support/pageActions/dashboardActions';
import { onTopBar } from '../../support/pageActions/topBarActions';
import { onSettingsPage } from '../../support/pageActions/settingsActions';

let electronApp: ElectronApplication;
let window: Page;
let localDataDir: string;

testPlaywright.beforeAll(async () => {
    await TrezorUserEnvLink.api.trezorUserEnvConnect();
    await TrezorUserEnvLink.api.startEmu({ wipe: true });
    await TrezorUserEnvLink.api.setupEmu({
        needs_backup: true,
        mnemonic:
            'cloth trim improve bag pigeon party wave mechanic beyond clean cake maze protect left assist carry guitar bridge nest faith critic excuse tooth dutch',
    });
    ({ electronApp, window, localDataDir } = await launchSuite());
    rmDirRecursive(localDataDir);
});

testPlaywright.afterAll(() => {
    electronApp.close();
});

/**
 * Test case:
 * 1. Discover a standard wallet
 * 2.
 */
testPlaywright('Change device homescreen', async () => {
    await onDashboardPage.passThroughInitialRun(window);
    await onDashboardPage.discoveryShouldFinish(window);

    await onTopBar.openSettings(window);
    await onSettingsPage.goToDesiredSettingsPlace(window, 'device');
    //TODO: implement scroll to desired section of settings, its not visible in app
    await window.getByTestId('data-test="@settings/device/homescreen-gallery"').click;
    await window.getByTestId('data-test="@modal/gallery/color_240x240/trezor-3d"').click;
    await TrezorUserEnvLink.api.pressYes();
    await window.getByText('Settings changed successfully').isVisible();
});
