import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const mnemonic =
    'nasty answer gentle inform unaware abandon regret supreme dragon gravity behind lava dose pilot garden into dynamic outer hard speed luxury run truly armed';
const pin = '1';

test.describe('Recovery T1B1 - dry run', { tag: ['@T1B1'] }, () => {
    test.use({
        deviceSetup: { mnemonic, pin },
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
        async ({ settingsPage, recoveryModal, trezorInput, device, devicePrompt }) => {
            await settingsPage.checkSeedButton.click();
            await recoveryModal.initDryCheck('standard', 24);
            await trezorInput.enterPinOnBlindMatrix(pin);
            await trezorInput.inputMnemonicT1B1(mnemonic);
            await expect(devicePrompt.modal).toContainTranslation('TR_CONFIRM_ACTION_ON_YOUR');
            await device.pressYes();
            await expect(recoveryModal.successTitle).toHaveText(
                'Wallet backup checked successfully',
            );
        },
    );
});
