import { MNEMONICS } from '@trezor/trezor-user-env-link';

import { TestCategory, TestPriority } from '../../support/enums/testAnnotations';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const pin = '1';

test.describe('Recovery T2T1 - dry run', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorStartConf: { model: 'T2T1', wipe: true },
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
                await expect(recoveryModal.successTitle).toHaveText(
                    'Wallet backup checked successfully',
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
                await expect(page.getByText('Reconnect your Trezor')).toBeVisible({
                    timeout: 30_000,
                });
            });

            await test.step('Simulate reconnect and check recovery dry run is reinitialized', async () => {
                await trezorUserEnvLink.startBridge();
                await recoveryModal.verifyDryCheckPrompt();
            });

            await test.step('Partially complete the dry run on emulator', async () => {
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
                await expect(recoveryModal.successTitle).toHaveText(
                    'Wallet backup checked successfully',
                );
            });
        },
    );
});
