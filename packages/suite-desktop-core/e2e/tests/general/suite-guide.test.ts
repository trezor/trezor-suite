import { expect, test } from '../../support/fixtures';

test.describe('Suite Guide', { tag: '@group=suite' }, () => {
    test.use({ startEmulator: false });
    /**
     * Test case:
     * 1. Go to Bug section in Suite Guide
     * 2. Select Dashboard
     * 3. Write into feedback field
     * 4. Submit bug report (reporttext)
     */
    test('Send a bug report', async ({ guidePanel }) => {
        await guidePanel.openPanel();
        await guidePanel.supportAndFeedbackButton.click();
        await guidePanel.sendBugReport({
            location: 'account',
            report: 'Henlo this is testy test writing hangry test user report',
        });
        await expect(guidePanel.feedbackSuccessToast).toBeVisible();
        await guidePanel.closeGuide();
    });

    /**
     * Test case:
     * 1. Go to Suggestion section in Suite Guide
     * 2. Look up an article
     * 3. Verify that the article is displayed
     */
    test('Look up an article', async ({ guidePanel }) => {
        const article = 'Install firmware';
        await guidePanel.openPanel();
        await guidePanel.lookupArticle(article);
        await expect(guidePanel.articleHeader).toHaveText(article);
        await guidePanel.closeGuide();
    });
});
