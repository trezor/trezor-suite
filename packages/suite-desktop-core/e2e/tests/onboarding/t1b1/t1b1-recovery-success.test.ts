import { expect, test } from '../../../support/fixtures';

const mnemonic =
    'nasty answer gentle inform unaware abandon regret supreme dragon gravity behind lava dose pilot garden into dynamic outer hard speed luxury run truly armed';

test.describe('Onboarding - recover wallet T1B1', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorStartConf: { model: 'T1B1', version: '1-latest', wipe: true },
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableFirmwareHashCheck();
    });

    test('Successfully recovers wallet from mnemonic', async ({
        page,
        onboardingPage,
        analyticsSection,
        devicePrompt,
        recoveryModal,
        trezorInput,
        trezorUserEnvLink,
    }) => {
        await analyticsSection.passThroughAnalytics();

        // Start wallet recovery process
        await onboardingPage.firmware.continueButton.click();
        await onboardingPage.recoverWalletButton.click();
        await recoveryModal.selectWordCount(24);
        await recoveryModal.selectBasicRecoveryButton.click();
        await devicePrompt.confirmOnDevicePromptIsShown();
        await page.waitForTimeout(1000);
        await trezorUserEnvLink.pressYes();

        // Input mnemonic
        await trezorInput.inputMnemonicT1B1(mnemonic);

        // Finalize recovery, skip pin, and verify success
        await onboardingPage.continueRecoveryButton.click();
        await onboardingPage.pin.skip();
        await onboardingPage.continueCoinsButton.click();
        await expect(onboardingPage.finalTitle).toBeVisible();
        await expect(onboardingPage.finalTitle).toContainText('Setup complete!');
    });
});
