import {
    test as testPlaywright,
    expect as expectPlaywright,
    ElectronApplication,
    Page,
} from '@playwright/test';

import { launchSuite } from '../../support/common';
import { onSuiteGuidePage } from '../../support/pageActions/suiteGuideActions';
import { onDashboardPage } from '../../support/pageActions/dashboardActions';

let electronApp: ElectronApplication;
let window: Page;

testPlaywright.beforeAll(async () => {
    ({ electronApp, window } = await launchSuite());
});

testPlaywright.afterEach(async () => {
    await onSuiteGuidePage.closeGuide(window);
});

testPlaywright.afterAll(() => {
    electronApp.close();
});

/**
 * Test case:
 * 1. Go to Bug section in Suite Guide
 * 2. Select Dashboard
 * 3. Write into feedback field
 * 4. Submit bug report (reporttext)
 */
testPlaywright('Send a bug report', async () => {
    const testData = {
        desiredLocation: 'Account',
        reportText: 'Henlo this is testy test writing hangry test user report',
    };
    onDashboardPage.optionallyDismissFwHashCheckError(window);

    await onSuiteGuidePage.openSidePanel(window);
    await onSuiteGuidePage.openFeedback(window);
    await onSuiteGuidePage.sendBugreport(window, testData);

    expectPlaywright(await onSuiteGuidePage.getSuccessToast(window)).toBeTruthy();
});

/**
 * Test case:
 * 1. Go to Suggestion section in Suite Guide
 * 2. Look up an article
 * 3. Verify that the article is displayed
 */
testPlaywright('Look up an article', async () => {
    const article = 'Install firmware';

    await onSuiteGuidePage.openSidePanel(window);
    await onSuiteGuidePage.lookupArticle(window, article);

    expectPlaywright(onSuiteGuidePage.getArticleHeader(window)).toContainText(article);
});
