import { expect, test } from '../../support/fixtures';
import { isModelWithTHP } from '../../support/helpers/modelHelper';

test.describe('Onboarding - analytics consent', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ page, url, onboardingPage }) => {
        await page.goto(url + 'accounts');
        await onboardingPage.disableNecessaryFirmwareChecks();
        await onboardingPage.disableAuthenticityCheck();
        await onboardingPage.optionallyDismissFwHashCheckError();
    });

    test('analytics consent appears on any route that is visited initially. this time /accounts', async ({
        model,
        analyticsSection,
        onboardingPage,
        walletPage,
        devicePrompt,
        dashboardPage,
    }) => {
        await expect(analyticsSection.heading).toBeVisible({ timeout: 30000 });
        await analyticsSection.continueButton.click();

        if (isModelWithTHP(model)) {
            await devicePrompt.allowConnectToTrezor();
            await onboardingPage.enterTHPPairingCode();
        }

        await onboardingPage.onboardingExitButton.click();

        await expect(dashboardPage.suiteLayout).toBeVisible();
        await walletPage.openAccount();
        await expect(walletPage.openSendFormButton).toBeVisible();
    });
});
