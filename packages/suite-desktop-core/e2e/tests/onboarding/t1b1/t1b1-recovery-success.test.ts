import { test, expect } from '../../../support/fixtures';

const mnemonic = [
    'nasty',
    'answer',
    'gentle',
    'inform',
    'unaware',
    'abandon',
    'regret',
    'supreme',
    'dragon',
    'gravity',
    'behind',
    'lava',
    'dose',
    'pilot',
    'garden',
    'into',
    'dynamic',
    'outer',
    'hard',
    'speed',
    'luxury',
    'run',
    'truly',
    'armed',
];

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
        analyticsPage,
        devicePrompt,
        recoverPage,
        wordInputPage,
        trezorUserEnvLink,
    }) => {
        await analyticsPage.passThroughAnalytics();

        // Start wallet recovery process
        await onboardingPage.firmwareContinueButton.click();
        await onboardingPage.recoverWalletButton.click();
        await recoverPage.selectWordCount(24);
        await recoverPage.selectBasicRecoveryButton.click();
        await devicePrompt.confirmOnDevicePromptIsShown();
        await page.waitForTimeout(1000);
        await trezorUserEnvLink.pressYes();

        // Input mnemonic
        await wordInputPage.inputMnemonicT1B1(mnemonic);

        // Finalize recovery, skip pin, and verify success
        await onboardingPage.continueRecoveryButton.click();
        await onboardingPage.skipPin();
        await onboardingPage.continueCoinsButton.click();
        await expect(onboardingPage.finalTitle).toBeVisible();
        await expect(onboardingPage.finalTitle).toContainText('Setup complete!');
    });
});
