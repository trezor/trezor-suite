import { expect, test } from '../../support/fixtures';

test.describe('Passphrase cancel', { tag: ['@group=passphrase'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all', passphrase_protection: true } });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test('possible to cancel passphrase', async ({ page, devicePrompt, dashboardPage }) => {
        await dashboardPage.deviceSwitchingOpenButton.click();
        await dashboardPage.addHiddenWalletButton.click();
        await page.getByTestId('@switch-device/add-existing-hidden-wallet-button').click();
        await dashboardPage.passphraseInput.fill('abc');
        await dashboardPage.passphraseInput.fill('abc');
        await dashboardPage.passphraseSubmitButton.click();
        await devicePrompt.confirmOnDevicePromptIsShown();

        await page.getByTestId('@confirm-on-device/close-button').click();
        await expect(page.getByTestId('@toast/auth-failed')).toBeVisible();
    });
});
