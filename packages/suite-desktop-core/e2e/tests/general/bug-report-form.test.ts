import { test as testPlaywright, expect as expectPlaywright } from '@playwright/test';

import { launchSuite, rmDirRecursive } from '../../support/common';
import { onSuiteGuidePage } from '../../support/pageActions/suiteGuideActions';

/**
 * Test case:
 * 1. Go to Bug section in Suite Guide
 * 2. Select Dashboard
 * 3. Write into feedback field
 * 4. Submit bug report (reporttext)
 */
testPlaywright('Send a bug report @debug', async () => {
    const testData = {
        desiredLocation: 'Account',
        reportText: 'Henlo this is testy test writing hangry test user report',
    };
    // TODO: improve the suite launch/termination placement later
    const { electronApp, window, localDataDir } = await launchSuite();
    rmDirRecursive(localDataDir);

    await onSuiteGuidePage.openSidePanel(window);
    await onSuiteGuidePage.openFeedback(window);
    await onSuiteGuidePage.sendBugreport(window, testData);

    expectPlaywright(await onSuiteGuidePage.getSuccessToast(window)).toBeTruthy();
    electronApp.close();
});
