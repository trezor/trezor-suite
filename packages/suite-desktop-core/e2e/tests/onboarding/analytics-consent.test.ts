import { expect, test } from '../../support/fixtures';

test.describe(
    'Onboarding - analytics consent',
    { tag: ['@group=device-management', '@webOnly'] },
    () => {
        test.beforeEach(async ({ onboardingPage }) => {
            await onboardingPage.disableFirmwareHashCheck();
        });

        test('analytics consent appears on any route that is visited initially. this time /accounts', async ({
            page,
            url,
            analyticsPage,
            onboardingPage,
        }) => {
            await page.goto(url + 'accounts');
            await expect(analyticsPage.heading).toBeVisible({ timeout: 30000 });
            await analyticsPage.continueButton.click();
            await page.getByTestId('@onboarding/exit-app-button').click();

            if (onboardingPage.isModelWithSecureElement()) {
                await onboardingPage.passThroughAuthenticityCheck();
                await onboardingPage.optionallyDismissFwHashCheckError();
            }

            await onboardingPage.onboardingViewOnlyEnableButton.click();
            await expect(page.getByTestId('@suite-layout/body')).toBeVisible();
            await page.getByTestId('@account-menu/btc/normal/0').click();
            await expect(page.getByTestId('@wallet/menu/wallet-send')).toBeVisible();
        });
    },
);
