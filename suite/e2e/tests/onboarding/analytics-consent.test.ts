import { expect, test } from '../../support/fixtures';

test.describe('Onboarding - analytics consent', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ page, url, onboardingPage }) => {
        await page.goto(url + 'accounts');
        await onboardingPage.disableNecessaryFirmwareChecks();
        await onboardingPage.disableAuthenticityCheck();
        await onboardingPage.optionallyDismissFwHashCheckError();
    });

    test('analytics consent appears on any route that is visited initially. this time /accounts', async ({
        device,
        analyticsSection,
        onboardingPage,
        settingsPage,
        walletPage,
        devicePrompt,
        dashboardPage,
    }) => {
        await expect(analyticsSection.heading).toBeVisible({ timeout: 30000 });
        await analyticsSection.continueButton.click();

        if (device.hasTHP) {
            await devicePrompt.allowConnectToTrezor();
            await onboardingPage.enterTHPPairingCode();
        }

        await onboardingPage.completeOnboardingButton.click();

        await expect(dashboardPage.suiteLayout).toBeVisible();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await walletPage.openAccount();
        await expect(walletPage.openSendFormButton).toBeVisible();
    });
});
