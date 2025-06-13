import { expect, test } from '../../support/fixtures';

test.describe('Suite initial run', { tag: ['@group=suite'] }, () => {
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    test('Until user passed through initial run, it will be there after reload', async ({
        page,
        analyticsSection,
        onboardingPage,
    }) => {
        await expect(analyticsSection.toggleSwitch).toBeVisible();
        await page.reload();
        // analytics screen is there until user confirms his choice
        await expect(analyticsSection.toggleSwitch).toBeVisible();
        await analyticsSection.continueButton.click();

        // Because init-analytics is split from the rest (device initialization),
        // superfast reload would probably stop during the initialization and bring
        // the device into inconsistent state.
        await page.waitForTimeout(1000);

        await page.reload();
        await expect(analyticsSection.toggleSwitch).not.toBeVisible();
        await expect(onboardingPage.onboardingContinueButton).toBeVisible();
    });

    test('Once user passed trough, skips initial run and shows connect-device modal', async ({
        page,
        dashboardPage,
        onboardingPage,
    }) => {
        await onboardingPage.completeOnboarding({ enableViewOnly: true });
        await page.reload();
        await expect(dashboardPage.deviceSwitchingOpenButton).toContainText('Connected');
    });
});
