import { createTestAnnotation } from '../../support/annotations';
import { TestCategory, TestPriority } from '../../support/enums/testAnnotations';
import { expect, test } from '../../support/fixtures';

const mnemonic =
    'nasty answer gentle inform unaware abandon regret supreme dragon gravity behind lava dose pilot garden into dynamic outer hard speed luxury run truly armed';
const pin = '1';

test.describe('Recovery T1B1 - dry run', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorStartConf: { model: 'T1B1', wipe: true },
        emulatorSetupConf: { mnemonic, pin },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('device');
    });

    test(
        'Standard recovery dry run',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a user can successfully perform a standard recovery dry run.',
                category: TestCategory.Settings,
                priority: TestPriority.High,
            }),
        },
        async ({ settingsPage, recoveryModal, trezorInput, trezorUserEnvLink, devicePrompt }) => {
            await settingsPage.checkSeedButton.click();
            await recoveryModal.initDryCheck('standard', 24);
            await trezorInput.enterPinOnBlindMatrix(pin);
            await trezorInput.inputMnemonicT1B1(mnemonic);
            await expect(devicePrompt.modal).toContainText(
                "Follow the instructions on your Trezor's screen",
            );
            await trezorUserEnvLink.pressYes();
            await expect(recoveryModal.successTitle).toHaveText(
                'Wallet backup checked successfully',
            );
        },
    );
});
