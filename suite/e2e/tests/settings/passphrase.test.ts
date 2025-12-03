import { expect, test } from '../../support/fixtures';

test.describe('Passphrase', { tag: ['@group=settings'] }, () => {
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
            await page.getByTestId('@toast/settings-applied').waitFor({ state: 'detached' });
        });
    });
});
