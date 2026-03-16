import { expect, test } from '../../support/fixtures';

test.describe('safety_checks Warnings', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeSafetyChecksLevel('prompt');
    });

    test('safety_checks Warnings', async ({ page, settingsPage,dashboardPage }) => {
        await test.step('Dismissible warning appears when safety_checks to prompt', async () => {
            await dashboardPage.suiteBannersContainer.click();
            await expect(page.getByTestId('@banner/safety-checks')).toBeVisible();
            await expect(page.getByTestId('@banner/safety-checks/button')).toBeVisible();
            await expect(page.getByTestId('@banner/safety-checks/dismiss')).toBeVisible();
        });

        await test.step('CTA button opens device settings when safety_checks to prompt', async () => {
            await dashboardPage.suiteBannersContainer.click();
            await page.getByTestId('@banner/safety-checks/button').click();
            await expect(settingsPage.settingsHeader).toBeVisible();
        });

        await test.step('Warning re-appears when set to Prompt again', async () => {
            await settingsPage.changeSafetyChecksLevel('strict');
            await dashboardPage.suiteBannersContainer.click();

            await expect(page.getByTestId('@banner/safety-checks/button')).toBeHidden();
            // Set safety_checks back to PromptTemporarily
            await settingsPage.changeSafetyChecksLevel('prompt');

            await expect(page.getByTestId('@banner/safety-checks/button')).toBeVisible();
        });

        await test.step('Dismiss button hides the warning when safety_checks to prompt', async () => {
            await dashboardPage.suiteBannersContainer.click();
            await page.getByTestId('@banner/safety-checks/dismiss').click();
        await expect(page.getByTestId('@banner/safety-checks/button')).toBeHidden();
        });
    });
});
