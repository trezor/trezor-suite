import { expect, test } from '../../support/fixtures';

test.describe('Suite initial run', { tag: ['@group=suite'] }, () => {
    test('Until user passed through initial run, it will be there after reload', async ({
        page,
        analyticsSection,
        onboardingPage,
    }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
        await onboardingPage.optionallyDismissFwHashCheckError();
        await expect(analyticsSection.toggleSwitch).toBeVisible();

        await page.reload();
        await onboardingPage.optionallyDismissFwHashCheckError();
        // analytics screen is there until user confirms his choice
        await expect(analyticsSection.toggleSwitch).toBeVisible();
        await analyticsSection.continueButton.click();
        await expect(page.getByTestId('@onboarding/exit-app-button')).toBeVisible();

        await page.reload();
        await onboardingPage.optionallyDismissFwHashCheckError();
        await expect(analyticsSection.toggleSwitch).toBeHidden();
        await expect(onboardingPage.onboardingContinueButton).toBeVisible();
    });

    test('Once user passed trough, skips initial run and shows connect-device modal', async ({
        page,
        dashboardPage,
        onboardingPage,
    }) => {
        await onboardingPage.completeOnboarding();
        await page.reload();
        await expect(dashboardPage.deviceSwitchingOpenButton).toContainText('Connected');
    });
});
