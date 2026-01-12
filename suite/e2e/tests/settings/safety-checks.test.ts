import { expect, test } from '../../support/fixtures';

test.describe('Safety Checks Settings', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('device');
    });

    test('There is button in device settings, that opens safety checks modal.', async ({
        settingsPage,
    }) => {
        await settingsPage.safetyChecksButton.click();
        await expect(settingsPage.safetyChecksConfirmButton).toBeVisible();
    });

    test('Only one level of Safety Checks is selected at a time', async ({ settingsPage }) => {
        // Open the safety checks modal.
        await settingsPage.safetyChecksButton.click();

        await test.step('Verify initial state: two radio buttons exist (one checked and one not)', async () => {
            await expect(settingsPage.safetyChecksRadioButton()).toHaveCount(2);
            await expect(settingsPage.safetyChecksRadioButtonCheck(true)).toHaveCount(1);
            await expect(settingsPage.safetyChecksRadioButtonCheck(false)).toHaveCount(1);
        });
        await test.step('Verify after clicking the unchecked option, the selection flips', async () => {
            await settingsPage.safetyChecksRadioButtonCheck(false).click();
            await expect(settingsPage.safetyChecksRadioButtonCheck(true)).toHaveCount(1);
            await expect(settingsPage.safetyChecksRadioButtonCheck(false)).toHaveCount(1);
        });
    });

    test('Confirm button is enabled only when Safety Checks value is changed', async ({
        settingsPage,
    }) => {
        // Open the safety checks modal.
        await settingsPage.safetyChecksButton.click();

        await expect(settingsPage.safetyChecksConfirmButton).toBeDisabled();
        await settingsPage.safetyChecksRadioButtonCheck(false).click();
        await expect(settingsPage.safetyChecksConfirmButton).toBeEnabled();
    });

    test('Device safety_check setting is changed after pressing the apply button', async ({
        page,
        device,
        devicePrompt,
        settingsPage,
    }) => {
        // Open the safety checks modal.
        await settingsPage.safetyChecksButton.click();

        // Don't assume the device is set to any particular value.
        // Just switch to the one that is not currently checked.
        const targetTestId =
            await test.step('Switch to the safety check level that is currently not selected', async () => {
                await settingsPage.safetyChecksRadioButtonCheck(false).click();
                const targetValue = await settingsPage
                    .safetyChecksRadioButtonCheck(true)
                    .getAttribute('data-testid');
                if (!targetValue) {
                    throw new Error('Target value not found');
                }

                return targetValue;
            });
        await test.step('Apply the change and confirm on the device', async () => {
            await settingsPage.safetyChecksConfirmButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressYes();
        });
        await test.step('Reopen the modal and verify the change', async () => {
            await settingsPage.safetyChecksButton.click();
            await expect(page.getByTestId(targetTestId).locator('input')).toBeChecked();
        });
    });
});
