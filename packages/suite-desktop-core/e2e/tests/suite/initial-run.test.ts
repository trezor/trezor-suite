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

test.describe('Suite initial run', { tag: ['@group=suite'] }, () => {
    test('Until user passed through initial run, it will be there after reload', async ({
        page,
        analyticsSection,
        onboardingPage,
    }) => {
        await onboardingPage.verifySuiteIsLoaded();
        optionallyDismissFwHashCheckError(page);
        await expect(analyticsSection.toggleSwitch).toBeVisible();

        await page.reload();
        await onboardingPage.verifySuiteIsLoaded();
        optionallyDismissFwHashCheckError(page);
        // analytics screen is there until user confirms his choice
        await expect(analyticsSection.toggleSwitch).toBeVisible();
        await analyticsSection.continueButton.click();
        await expect(page.getByTestId('@onboarding/exit-app-button')).toBeVisible();

        await page.reload();
        await onboardingPage.verifySuiteIsLoaded();
        optionallyDismissFwHashCheckError(page);
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
