import { test, expect } from '../../support/fixtures';

test.describe('Passphrase', { tag: ['@group=settings'] }, () => {
    test.use({ emulatorStartConf: { wipe: true } });
    test.beforeEach(async ({ onboardingPage, dashboardPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
        await settingsPage.navigateTo();
        await settingsPage.deviceTabButton.click();
    });

    test('Enable Passphrase protection', async ({ page, trezorUserEnvLink }) => {
        await page.getByTestId('@settings/device/passphrase-switch').click();
        await expect(page.getByTestId('@prompts/confirm-on-device')).toBeVisible();
        await trezorUserEnvLink.pressYes();
        await page.getByTestId('@prompts/confirm-on-device').waitFor({ state: 'detached' });
        await test.step('Verifies notification toast is displayed and then disappears', async () => {
            await expect(page.getByTestId('@toast/settings-applied')).toBeVisible();
            await page.getByTestId('@toast/settings-applied').waitFor({ state: 'detached' });
        });
    });
});
