import { expect as expectPlaywright } from '@playwright/test';

import { test as testPlaywright } from '../../support/fixtures';

/**
 * Test case:
 * 1. Go to Bug section in Suite Guide
 * 2. Select Dashboard
 * 3. Write into feedback field
 * 4. Submit bug report (reporttext)
 */
testPlaywright('Send a bug report', async ({ dashboardPage, suiteGuidePage }) => {
    const testData = {
        desiredLocation: 'Account',
        reportText: 'Henlo this is testy test writing hangry test user report',
    };

    dashboardPage.optionallyDismissFwHashCheckError();

    await suiteGuidePage.openSidePanel();
    await suiteGuidePage.openFeedback();
    await suiteGuidePage.sendBugreport(testData);

    expectPlaywright(await suiteGuidePage.getSuccessToast()).toBeTruthy();
    await suiteGuidePage.closeGuide();
});

/**
 * Test case:
 * 1. Go to Suggestion section in Suite Guide
 * 2. Look up an article
 * 3. Verify that the article is displayed
 */
testPlaywright('Look up an article', async ({ suiteGuidePage }) => {
    const article = 'Install firmware';

    await suiteGuidePage.openSidePanel();
    await suiteGuidePage.lookupArticle(article);

    expectPlaywright(suiteGuidePage.getArticleHeader()).toContainText(article);
    await suiteGuidePage.closeGuide();
});
