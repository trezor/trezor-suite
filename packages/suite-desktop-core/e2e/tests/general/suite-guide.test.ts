import { test, expect } from '../../support/fixtures';

test.use({ startEmulator: false });
/**
 * Test case:
 * 1. Go to Bug section in Suite Guide
 * 2. Select Dashboard
 * 3. Write into feedback field
 * 4. Submit bug report (reporttext)
 */
test('Send a bug report', async ({ suiteGuidePage }) => {
    await suiteGuidePage.openPanel();
    await suiteGuidePage.supportAndFeedbackButton.click();
    await suiteGuidePage.sendBugReport({
        location: 'account',
        report: 'Henlo this is testy test writing hangry test user report',
    });
    await expect(suiteGuidePage.feedbackSuccessToast).toBeVisible();
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
    await suiteGuidePage.openPanel();
    await suiteGuidePage.lookupArticle(article);
    await expect(suiteGuidePage.articleHeader).toHaveText(article);
    await suiteGuidePage.closeGuide();
});
