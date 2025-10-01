import { expect, test } from '../../support/fixtures';

test.describe(
    'Onboarding - analytics consent',
    { tag: ['@group=device-management', '@webOnly'] },
    () => {
        test.beforeEach(async ({ page, url, onboardingPage }) => {
            await page.goto(url + 'accounts');
            await onboardingPage.disableNecessaryFirmwareChecks();
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

            if (model.isModelWithTHP()) {
                await devicePrompt.allowConnectToTrezor();
                await onboardingPage.enterTHPPairingCode();
            }

            await onboardingPage.onboardingContinueButton.click();

            if (model.isModelWithSecureElement()) {
                await onboardingPage.passThroughAuthenticityCheck();
            }

            await expect(dashboardPage.suiteLayout).toBeVisible();
            await walletPage.openAccount();
            await expect(walletPage.openSendFormButton).toBeVisible();
        });
    },
);
