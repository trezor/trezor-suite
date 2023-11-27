import { test as testPlaywright, expect as expectPlaywright } from '@playwright/test';

import { launchSuite, rmDirRecursive, waitForDataTestSelector } from '../../support/common';
import { onSuiteGuide } from '../../support/pageActions/suiteGuideActions';

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

    await waitForDataTestSelector(window, '@welcome/title');

    await onSuiteGuide.openSidePanel(window);
    await onSuiteGuide.openFeedback(window);
    await onSuiteGuide.sendBugreport(window, testData);

    //
    // Assert
    //
    const successToast = await waitForDataTestSelector(window, '@toast/user-feedback-send-success');
    await expectPlaywright(successToast).toBeTruthy();

    electronApp.close();
});
