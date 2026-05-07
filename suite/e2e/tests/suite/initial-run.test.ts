import { Page } from '@playwright/test';

import { expect, test } from '../../support/fixtures';

const optionallyDismissFwHashCheckError = (page: Page) => {
    // dismisses the error modal only if it appears (handle it async in parallel, not necessary to block the rest of the flow)
    // eslint-disable-next-line playwright/no-wait-for-selector
    void page
        .waitForSelector('[data-testid="@device-compromised/dismiss-button"]', {
            timeout: 10_000,
        })
        .then(async button => await button.click())
        .catch(() => {}); // Intentionally ignore timeout errors - means the modal was not shown
};

test.describe('Suite initial run', { tag: ['@T3W1', '@T3T1'] }, () => {
    test('Until user passed through initial run, it will be there after reload', async ({
        page,
        device,
        analyticsSection,
        onboardingPage,
        devicePrompt,
    }) => {
        // I was not able to debug why the initial start can be handled by onboardingPage.optionallyDismissFwHashCheckError
        // but follow up reloads need a different approach that is defined here above.
        await onboardingPage.optionallyDismissFwHashCheckError();
        await expect(analyticsSection.toggleSwitch).toBeVisible();

        await page.reload();
        await onboardingPage.verifySuiteIsLoaded();
        optionallyDismissFwHashCheckError(page);
        // analytics screen is there until user confirms his choice
        await expect(analyticsSection.toggleSwitch).toBeVisible();
        await analyticsSection.continueButton.click();

        if (device.hasTHP) {
            await devicePrompt.allowConnectToTrezor();
            await onboardingPage.enterTHPPairingCode();
        }

        await expect(page.getByTestId('@onboarding/confirm-manual-device-check')).toBeVisible();

        await page.reload();

        await onboardingPage.verifySuiteIsLoaded();
        optionallyDismissFwHashCheckError(page);
        await expect(analyticsSection.toggleSwitch).toBeHidden();
        await expect(onboardingPage.confirmManualDeviceCheckButton).toBeVisible();
    });

    test('Once user passed trough, skips initial run and shows connect-device modal', async ({
        page,
        onboardingPage,
    }) => {
        await onboardingPage.completeOnboarding();
        await page.reload();
        await expect(page.getByTestId('@deviceStatus-connected').first()).toBeVisible({
            timeout: 30_000,
        });
    });
});
