import { test as testPlaywright, ElectronApplication, Page } from '@playwright/test';

import { launchSuite, rmDirRecursive } from '../../support/common';
import { onTopBar } from '../../support/pageActions/topBarActions';
import { onSettingsPage } from '../../support/pageActions/settingsActions';

let electronApp: ElectronApplication;
let window: Page;
let localDataDir: string;

testPlaywright.beforeAll(async () => {
    ({ electronApp, window, localDataDir } = await launchSuite());
    rmDirRecursive(localDataDir);
});

testPlaywright.afterAll(() => {
    electronApp.close();
});

/**
 * Test case:
 * 1. Navigate to `Settings/Application`
 * 2. Scroll down to the `Experimental features` part
 * 3. Click on Join button
 * 4. Confrim the EAP modal
 * 5. Check if there is a button with `Leave` on it
 */
testPlaywright('Join early access button', async () => {
    const buttonText = 'Leave';

    await onTopBar.openSettings(window);
    await onSettingsPage.goToDesiredSettingsPlace(window, 'general');
    await onSettingsPage.joinEarlyAccessProgram(window);

    await expect(onSettingsPage.getEarlyAccessButtonText(window)).toContain(buttonText);
});
