import { expect, test } from '../../support/fixtures';

test.describe('Guide without device', { tag: ['@group=suite', '@webOnly'] }, () => {
    test.beforeEach(async ({ trezorUserEnvLink }) => {
        await trezorUserEnvLink.stopEmu();
        await trezorUserEnvLink.stopBridge();
    });
    test.use({ startEmulator: false });
    test('open / close guide', async ({ page, suiteGuidePage, settingsPage }) => {
        // Open guide
        await suiteGuidePage.openPanel();
        const firstNode = suiteGuidePage.guideNodes.first().locator('> *').first();
        const text = await firstNode.innerText();
        await firstNode.click();
        await expect(suiteGuidePage.guideLabel).toHaveText(text);
        await firstNode.click();
        await suiteGuidePage.closeGuide();
        await expect(suiteGuidePage.guideButton).toBeVisible();

        // Feedback form
        await suiteGuidePage.openPanel();
        await suiteGuidePage.supportAndFeedbackButton.click();
        await suiteGuidePage.feedbackFormButton.click();
        await page.getByTestId('@guide/feedback/suggestion/5').click();
        await suiteGuidePage.bugInputTextField.fill('Hello!');
        await suiteGuidePage.submitButton.click();
        await expect(suiteGuidePage.feedbackSuccessToast).toBeVisible();

        // Guide over modal
        await settingsPage.navigateTo('application');
        await settingsPage.showLogButton.click();
        await suiteGuidePage.closeGuide();
        await suiteGuidePage.openPanel();
        await expect(suiteGuidePage.guidePanel).toBeVisible();

        // Search input
        await suiteGuidePage.searchInput.fill('trezor');
        await expect
            .poll(async () => (await suiteGuidePage.searchResults.all()).length)
            .toBeGreaterThan(0);
        await suiteGuidePage.searchInput.fill('meow-wuf-nonsense');
        await expect(suiteGuidePage.searchNoResults).toBeVisible();
    });
});

test.describe('Guide with device', { tag: ['@group=suite'] }, () => {
    test('onboarding with device', async ({
        page,
        analyticsPage,
        onboardingPage,
        suiteGuidePage,
    }) => {
        await onboardingPage.disableFirmwareHashCheck();
        await onboardingPage.optionallyDismissFwHashCheckError();
        await analyticsPage.continueButton.click();

        await suiteGuidePage.openPanel();
        await expect(page.getByTestId('@guide/panel')).toBeVisible();
        await page.getByTestId('@guide/button-feedback').click();
        await expect(suiteGuidePage.bugFormButton).toBeVisible();
        await expect(suiteGuidePage.feedbackFormButton).toBeVisible();
    });
});
