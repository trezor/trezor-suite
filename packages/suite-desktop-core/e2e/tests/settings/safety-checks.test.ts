import { test, expect } from '../../support/fixtures';

test.describe('Safety Checks Settings', { tag: ['@group=settings'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('device');
    });

    test('There is button in device settings, that opens safety checks modal.', async ({
        page,
    }) => {
        await page.getByTestId('@settings/device/safety-checks-button').click();
        await expect(page.getByTestId('@safety-checks-apply')).toBeVisible();
    });

    test('Only one level is selected at a time', async ({ page }) => {
        // Open the safety checks modal.
        await page.getByTestId('@settings/device/safety-checks-button').click();

        // There should be two radio buttons, one checked and one not.
        await expect(page.locator('[data-testid*="@radio-button"]')).toHaveCount(2);
        await expect(
            page.locator('[data-testid*="@radio-button"][data-checked="true"]'),
        ).toHaveCount(1);
        await expect(
            page.locator('[data-testid*="@radio-button"][data-checked="false"]'),
        ).toHaveCount(1);

        await page.locator('[data-testid*="@radio-button"][data-checked="false"]').click();
        // After switching the value, there should still be one checked and one unchecked.
        await expect(
            page.locator('[data-testid*="@radio-button"][data-checked="true"]'),
        ).toHaveCount(1);
        await expect(
            page.locator('[data-testid*="@radio-button"][data-checked="false"]'),
        ).toHaveCount(1);
    });

    test('Apply button is enabled only when value is changed', async ({ page }) => {
        // Open the safety checks modal.
        await page.getByTestId('@settings/device/safety-checks-button').click();

        await expect(page.getByTestId('@safety-checks-apply')).toBeDisabled();
        await page.locator('[data-testid*="@radio-button"][data-checked="false"]').click();
        await expect(page.getByTestId('@safety-checks-apply')).not.toBeDisabled();
    });

    test('Device safety_check setting is changed after pressing the apply button', async ({
        page,
        devicePrompt,
        trezorUserEnvLink,
    }) => {
        await page.getByTestId('@settings/device/safety-checks-button').click();
        // Don't assume the device is set to any particular value.
        // Just switch to the one that is not currently checked.
        await page.locator('[data-testid*="@radio-button"][data-checked="false"]').click();
        const targetValue = await page
            .locator('[data-testid*="@radio-button"][data-checked="true"]')
            .getAttribute('data-testid');
        if (!targetValue) {
            throw new Error('Target value not found');
        }
        // Changing safety_checks to targetValue
        await page.getByTestId('@safety-checks-apply').click();
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();

        await page.getByTestId('@settings/device/safety-checks-button').click();
        await expect(page.getByTestId(targetValue)).toHaveAttribute('data-checked', 'true');
    });
});
