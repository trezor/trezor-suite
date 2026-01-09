import { TestCategory, TestPriority } from '@trezor/e2e-utils';
import { MNEMONICS } from '@trezor/trezor-user-env-link';

import { BRIDGE_VERSION } from '../../support/bridge';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const pin = '1';

test.describe('Recovery - dry run', { tag: ['@T3W1', '@T3T1', '@smoke'] }, () => {
    test.use({
        emulatorSetupConf: { mnemonic: 'mnemonic_all', pin },
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
        async ({ settingsPage, recoveryModal, trezorUserEnvLink, trezorInput }) => {
            await test.step('Initiate recovery dry run in settings', async () => {
                await settingsPage.checkSeedButton.click();
                await recoveryModal.userUnderstandsCheckbox.click();
                await recoveryModal.startButton.click();
                await recoveryModal.verifyDryCheckPrompt();
            });

            await test.step('Do the recover dry run on emulator', async () => {
                await trezorUserEnvLink.pressYes();
                await trezorUserEnvLink.inputEmu('1');
                await trezorUserEnvLink.selectNumOfWordsEmu(12);
                await trezorUserEnvLink.pressYes();
                await trezorInput.inputMnemonicT2T1(MNEMONICS.mnemonic_all);
            });

            await test.step('Verify success in suite', async () => {
                await trezorUserEnvLink.pressYes();
                await expect(recoveryModal.successTitle).toHaveTranslation(
                    'TR_SEED_CHECK_SUCCESS_TITLE',
                );
            });
        },
    );

    test(
        'Recovery with device reconnection',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a user can successfully perform a recovery dry run with device reconnection.',
                category: TestCategory.Settings,
                priority: TestPriority.Medium,
            }),
        },
        async ({ page, settingsPage, recoveryModal, trezorUserEnvLink, trezorInput }) => {
            await test.step('Initiate recovery dry run in settings', async () => {
                await settingsPage.checkSeedButton.click();
                await recoveryModal.userUnderstandsCheckbox.click();
                await recoveryModal.startButton.click();
                await recoveryModal.verifyDryCheckPrompt();
            });

            await test.step('Partially complete the dry run on emulator', async () => {
                await trezorUserEnvLink.pressYes();
                await trezorUserEnvLink.inputEmu('1');
                await trezorUserEnvLink.selectNumOfWordsEmu(12);
                await trezorUserEnvLink.pressYes();
                await trezorUserEnvLink.inputEmu('all');
            });

            await test.step('Simulate disconnect', async () => {
                await trezorUserEnvLink.stopBridge();
                await expect(page.getByText('Wallet backup check failed')).toBeVisible({
                    timeout: 30_000,
                });
            });

            await test.step('Simulate reconnect and check recovery dry run is reinitialized', async () => {
                await trezorUserEnvLink.startBridge(BRIDGE_VERSION);
                await recoveryModal.verifyDryCheckPrompt();
            });

            await test.step('Complete the dry run on emulator', async () => {
                await trezorUserEnvLink.selectNumOfWordsEmu(12);
                await trezorUserEnvLink.pressYes();
                await trezorInput.inputMnemonicT2T1(MNEMONICS.mnemonic_all);
                await trezorUserEnvLink.pressYes();
                await expect(recoveryModal.successTitle).toHaveTranslation(
                    'TR_SEED_CHECK_SUCCESS_TITLE',
                );
            });
        },
    );

    test(
        'Recovery after partial recovery',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a user can successfully perform a recovery dry run after page reload.',
                category: TestCategory.Settings,
                priority: TestPriority.Medium,
            }),
            tag: ['@desktopOnly', '@T3W1', '@T3T1'],
        },
        async ({ page, settingsPage, recoveryModal, trezorUserEnvLink, trezorInput }) => {
            await test.step('Initiate recovery dry run in settings', async () => {
                await settingsPage.checkSeedButton.click();
                await recoveryModal.userUnderstandsCheckbox.click();
                await recoveryModal.startButton.click();
                await recoveryModal.verifyDryCheckPrompt();
            });

            await test.step('Partially complete the dry run on emulator', async () => {
                await trezorUserEnvLink.pressYes();
                await trezorUserEnvLink.inputEmu('1');
                await trezorUserEnvLink.selectNumOfWordsEmu(12);
                await trezorUserEnvLink.pressYes();
                await trezorUserEnvLink.inputEmu('all');
            });

            await test.step('Reload suite and check recovery dry run is reinitialized', async () => {
                await page.reload();
                await recoveryModal.verifyDryCheckPrompt();
            });

            await test.step('Complete the dry run on emulator', async () => {
                await trezorUserEnvLink.selectNumOfWordsEmu(12);
                await trezorUserEnvLink.pressYes();
                await trezorInput.inputMnemonicT2T1(MNEMONICS.mnemonic_all);
                await trezorUserEnvLink.pressYes();
                await expect(recoveryModal.successTitle).toHaveTranslation(
                    'TR_SEED_CHECK_SUCCESS_TITLE',
                );
            });
        },
    );
});
