import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

const mnemonic =
    'nasty answer gentle inform unaware abandon regret supreme dragon gravity behind lava dose pilot garden into dynamic outer hard speed luxury run truly armed';

test.describe('Onboarding - recover wallet T1B1', { tag: ['@firmware-ready', '@T1B1'] }, () => {
    test.use({
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    test(
        'Successfully recovers wallet from mnemonic',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a user can successfully recover a wallet from a mnemonic during the onboarding process.',
                category: TestCategory.Onboarding,
                priority: TestPriority.High,
            }),
        },
        async ({
            page,
            device,
            onboardingPage,
            analyticsSection,
            devicePrompt,
            recoveryModal,
            trezorInput,
        }) => {
            await analyticsSection.passThroughAnalytics();

            // Start wallet recovery process
            await onboardingPage.firmware.continueThroughFirmware();
            await onboardingPage.recoverWalletButton.click();
            await recoveryModal.selectWordCount(24);
            await recoveryModal.selectRecoveryButton('standard').click();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await page.waitForTimeout(1000);
            await device.pressYes();

            // Input mnemonic
            await trezorInput.inputMnemonicT1B1(mnemonic);

            // Finalize recovery, skip pin, and verify success
            await onboardingPage.continueRecoveryButton.click();
            await onboardingPage.pin.skip();
            await expect(onboardingPage.completeOnboardingButton).toBeVisible();
        },
    );
});
