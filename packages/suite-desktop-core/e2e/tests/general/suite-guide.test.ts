import { test, expect } from '../../support/fixtures';

/**
 * Test case:
 * 1. Go to Bug section in Suite Guide
 * 2. Select Dashboard
 * 3. Write into feedback field
 * 4. Submit bug report (reporttext)
 */
test('Send a bug report', async ({ onboardingPage, suiteGuidePage }) => {
    const testData = {
        desiredLocation: 'Account',
        reportText: 'Henlo this is testy test writing hangry test user report',
    };

    onboardingPage.optionallyDismissFwHashCheckError();

    await suiteGuidePage.openSidePanel();
    await suiteGuidePage.openFeedback();
    await suiteGuidePage.sendBugReport(testData);

    expect(await suiteGuidePage.getSuccessToast()).toBeTruthy();
    await suiteGuidePage.closeGuide();
});

/**
 * Test case:
 * 1. Go to Suggestion section in Suite Guide
 * 2. Look up an article
 * 3. Verify that the article is displayed
 */
test('Look up an article', async ({ suiteGuidePage }) => {
    const article = 'Install firmware';

    await suiteGuidePage.openSidePanel();
    await suiteGuidePage.lookupArticle(article);

    expect(suiteGuidePage.getArticleHeader()).toContainText(article);
    await suiteGuidePage.closeGuide();
});
