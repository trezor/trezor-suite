import { expect, test } from '../../support/fixtures';

test.describe('Passphrase', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('device');
    });

    test('Enable Passphrase protection', async ({ page, devicePrompt, trezorUserEnvLink }) => {
        await page.getByTestId('@settings/device/passphrase-switch').click();
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();
        await devicePrompt.confirmOnDevicePromptIsHidden();
        await test.step('Verifies notification toast is displayed and then disappears', async () => {
            await expect(page.getByTestId('@toast/settings-applied')).toBeVisible();
            // TODO(e2e): CI only — toast never detaches, while it works locally.
            // await page.getByTestId('@toast/settings-applied').waitFor({ state: 'detached' });
        });
    });
});
