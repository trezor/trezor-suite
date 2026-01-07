import { test } from '../../support/fixtures';

test.describe('Passphrase cancel', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all', passphrase_protection: true } });

    test('possible to cancel passphrase', async ({
        devicePrompt,
        onboardingPage,
        dashboardPage,
    }) => {
        await onboardingPage.completeOnboarding();

        await dashboardPage.deviceSwitchingOpenButton.click();
        await dashboardPage.addHiddenWalletButton.click();
        await dashboardPage.addExistingHiddenWalletButton.click();
        await dashboardPage.passphraseInput.fill('abc');
        await dashboardPage.passphraseSubmitButton.click();
        await devicePrompt.confirmOnDevicePromptIsShown();

        await devicePrompt.closeButton.click();
    });
});
