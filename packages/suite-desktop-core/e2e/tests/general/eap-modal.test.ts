import {
    test as testPlaywright,
    ElectronApplication,
    Page,
    expect as expectPlaywright,
} from '@playwright/test';

import { launchSuite } from '../../support/common';
import { onTopBar } from '../../support/pageActions/topBarActions';
import { onSettingsPage } from '../../support/pageActions/settingsActions';

let electronApp: ElectronApplication;
let window: Page;

testPlaywright.beforeAll(async () => {
    ({ electronApp, window } = await launchSuite());
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
// TODO: FIX settings cleanup:  eap setting is remembered even after cache cleanup at the beginning of the test. This shouldn't affect gha run but breaks the local one.
testPlaywright('Join early access button', async () => {
    const buttonText = 'Leave';

    await onTopBar.openSettings(window);
    await onSettingsPage.goToDesiredSettingsPlace(window, 'general');
    await onSettingsPage.joinEarlyAccessProgram(window);

    expectPlaywright(await onSettingsPage.getEarlyAccessButtonText(window)).toContain(buttonText);
});
