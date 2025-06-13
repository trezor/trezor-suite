import { TestCategory, TestPriority } from '../../support/enums/testAnnotations';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Guide without device', { tag: ['@group=suite', '@webOnly'] }, () => {
    test.use({ startEmulator: false });
    test(
        'open / close guide',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can open and close the guide.',
                category: TestCategory.SuiteGuide,
                priority: TestPriority.Low,
            }),
        },
        async ({ page, guidePanel, settingsPage, analyticsSection }) => {
            await analyticsSection.continueButton.click();

            // Open guide
            await guidePanel.openPanel();
            const firstNode = guidePanel.guideNodes.first().locator('> *').first();
            const text = await firstNode.innerText();
            await firstNode.click();
            await expect(guidePanel.guideLabel).toHaveText(text);
            await firstNode.click();
            await guidePanel.closeGuide();
            await expect(guidePanel.guideButton).toBeVisible();

            // Feedback form
            await guidePanel.openPanel();
            await guidePanel.supportAndFeedbackButton.click();
            await guidePanel.feedbackFormButton.click();
            await page.getByTestId('@guide/feedback/suggestion/5').click();
            await guidePanel.bugInputTextField.fill('Hello!');
            await guidePanel.submitButton.click();
            await expect(guidePanel.feedbackSuccessToast).toBeVisible();

            // Guide over modal
            await settingsPage.navigateTo('application');
            await settingsPage.showLogButton.click();
            await guidePanel.closeGuide();
            await guidePanel.openPanel();
            await expect(guidePanel.guidePanel).toBeVisible();

            // Search input
            await guidePanel.searchInput.fill('trezor');
            await expect
                .poll(async () => (await guidePanel.searchResults.all()).length)
                .toBeGreaterThan(0);
            await guidePanel.searchInput.fill('meow-wuf-nonsense');
            await expect(guidePanel.searchNoResults).toBeVisible();
        },
    );
});

test.describe('Guide with device', { tag: ['@group=suite'] }, () => {
    test(
        'onboarding with device',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can open and close the guide with device connected.',
                category: TestCategory.SuiteGuide,
                priority: TestPriority.Low,
            }),
        },
        async ({ page, analyticsSection, onboardingPage, guidePanel }) => {
            await onboardingPage.disableNecessaryFirmwareChecks();
            await onboardingPage.optionallyDismissFwHashCheckError();
            await analyticsSection.continueButton.click();

            await guidePanel.openPanel();
            await expect(page.getByTestId('@guide/panel')).toBeVisible();
            await page.getByTestId('@guide/button-feedback').click();
            await expect(guidePanel.bugFormButton).toBeVisible();
            await expect(guidePanel.feedbackFormButton).toBeVisible();
        },
    );
});
