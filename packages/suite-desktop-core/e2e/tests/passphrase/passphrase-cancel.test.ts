import { test } from '../../support/fixtures';

test.describe('Passphrase cancel', { tag: ['@group=passphrase'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all', passphrase_protection: true } });

    test('possible to cancel passphrase', async ({
        page,
        devicePrompt,
        onboardingPage,
        dashboardPage,
    }) => {
        await onboardingPage.completeOnboarding();

        await dashboardPage.deviceSwitchingOpenButton.click();
        await dashboardPage.addHiddenWalletButton.click();
        await page.getByTestId('@switch-device/add-existing-hidden-wallet-button').click();
        await dashboardPage.passphraseInput.fill('abc');
        await dashboardPage.passphraseSubmitButton.click();
        await devicePrompt.confirmOnDevicePromptIsShown();

        await page.getByTestId('@confirm-on-device/close-button').click();
    });
});
