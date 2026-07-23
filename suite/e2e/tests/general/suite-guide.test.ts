import { Locator } from '@playwright/test';

import { expect, test } from '../../support/fixtures';

const APP_VERSION_REGEX = /^Current version \d+\.\d+\.\d+(-dev)?$/;
const FIRMWARE_VERSION_REGEX = /^Current version \d+\.\d+\.\d+$/;
const FIRMWARE_VERSION_NO_DEVICE = '-/-';

// This can possibly break by a change of GITBOOK_REVISION in docs/features/guide.md
const CATEGORY_WITH_IMAGE = '2_dashboard-and-coins';
const ARTICLE_WITH_IMAGE = '2_dashboard-and-coins/5_show-public-key.md';

test.describe('Suite Guide', { tag: ['@noDevice'] }, () => {
    test.use({ startEmulator: false });

    test.beforeEach(async ({ guidePanel }) => {
        await guidePanel.openPanel();
    });

    test('Send a bug report', async ({ guidePanel }) => {
        await guidePanel.supportAndFeedbackButton.click();
        await expect.soft(guidePanel.supportAppVersion).toHaveText(APP_VERSION_REGEX);
        await expect.soft(guidePanel.supportFirmwareVersion).toHaveText(FIRMWARE_VERSION_NO_DEVICE);
        await guidePanel.sendBugReport({
            location: 'account',
            report: 'Henlo this is testy test writing hangry test user report',
        });
        await expect(guidePanel.feedbackSuccessToast).toHaveTranslation('TR_GUIDE_FEEDBACK_SENT');
        await guidePanel.closeGuide();
    });

    test('Send feedback', async ({ guidePanel }) => {
        await guidePanel.supportAndFeedbackButton.click();
        await guidePanel.sendFeedback({
            rating: 5,
            report: 'Henlo this is testy test writing happy feedback',
        });
        await expect(guidePanel.feedbackSuccessToast).toHaveTranslation('TR_GUIDE_FEEDBACK_SENT');
        await guidePanel.closeGuide();
    });

    test('Open an article from search', async ({ guidePanel }) => {
        const article = 'Install firmware';
        await guidePanel.lookupArticle(article);
        await expect(guidePanel.guideLabel).toHaveText(article);
        await expect(guidePanel.article).not.toBeEmpty();
        await guidePanel.closeGuide();
    });

    test('Open an article and view its screenshot', async ({ guidePanel }) => {
        await guidePanel.category(CATEGORY_WITH_IMAGE).click();

        const node = guidePanel.node(ARTICLE_WITH_IMAGE);
        const articleTitle = await node.innerText();
        await node.click();

        await expect(guidePanel.guideLabel).toHaveText(articleTitle);
        await expect(guidePanel.article).not.toBeEmpty();

        await guidePanel.openArticleImageModal(guidePanel.articleImage.first());
        await guidePanel.closeArticleImageModal();

        await guidePanel.closeGuide();
    });
});

test.describe('Suite Guide with device', { tag: ['@T3W1'] }, () => {
    test('Navigate the guide and verify versions with a device', async ({
        guidePanel,
        onboardingPage,
        page,
    }) => {
        await onboardingPage.completeOnboarding();
        await guidePanel.openPanel();

        let category: Locator;
        let node: Locator;
        let categoryTitle: string;

        await test.step('Navigate to a category', async () => {
            category = guidePanel.category(CATEGORY_WITH_IMAGE);
            categoryTitle = await category.innerText();
            await category.click();
            await expect(guidePanel.guideLabel).toHaveText(categoryTitle);
        });

        await test.step('Navigate to an article', async () => {
            node = guidePanel.node(ARTICLE_WITH_IMAGE);
            const articleTitle = await node.innerText();
            await node.click();
            await expect(guidePanel.guideLabel).toHaveText(articleTitle);
            await expect(guidePanel.article).not.toBeEmpty();
        });

        await test.step('Navigate back to the home', async () => {
            await guidePanel.backButton.click();
            await expect(guidePanel.guideLabel).toHaveText(categoryTitle!);
            await guidePanel.backButton.click();
            await expect(guidePanel.category(CATEGORY_WITH_IMAGE)).toBeVisible();
        });

        await test.step('Verify versions with device connected', async () => {
            await guidePanel.supportAndFeedbackButton.click();
            await expect.soft(guidePanel.supportAppVersion).toHaveText(APP_VERSION_REGEX);
            await expect.soft(guidePanel.supportFirmwareVersion).toHaveText(FIRMWARE_VERSION_REGEX);
        });

        await test.step('Close the guide with Escape key', async () => {
            await page.keyboard.press('Escape');
            await expect(guidePanel.guidePanel).toBeHidden();
        });
    });
});
