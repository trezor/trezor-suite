import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

import { isWebProject, skipFixture } from '../../support/common';
import { AccountLabelId } from '../../support/enums/accountLabelId';
import { expect, test } from '../../support/fixtures';

test.use({ exceptionLogger: skipFixture });
test.describe(
    'Suite Sync - Labelling',
    { tag: ['@webOnly', '@specificFirmware', '@T3W1', '@T3T1'] },
    () => {
        test.use({
            firmwareVersion: '2-main',
            emulatorSetupConf: {
                mnemonic: generateMnemonic(wordlist),
                passphrase_protection: true,
            },
        });

        test('Sync account label across sessions', async ({
            page,
            onboardingPage,
            settingsPage,
            walletPage,
            metadataPage,
        }) => {
            await test.step('Onboarding and enable Suite Sync', async () => {
                await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
                await metadataPage.enableSuiteSync();
            });

            const newLabel = 'my synced btc account label';
            await test.step('Change BTC account label in first session', async () => {
                await walletPage
                    .accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 })
                    .click();
                await metadataPage.account.clickEditLabelButton(AccountLabelId.BitcoinDefault1);
                await metadataPage.account.metadataInput.fill(newLabel);
                await page.keyboard.press('Enter');
                await expect(
                    walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
                ).toHaveText(newLabel);

                await page.waitForTimeout(5_000); // wait for sync to complete
            });

            await test.step('Wipe Suite to simulate new session', async () => {
                await settingsPage.navigateTo('application');
                await settingsPage.resetAppButton.click();
            });

            await test.step('Onboarding and enable Suite Sync', async () => {
                await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
                await metadataPage.enableSuiteSync();
            });

            await test.step('Verify BTC account label is synced in second session', async () => {
                await walletPage
                    .accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 })
                    .click();
                await expect(
                    walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
                ).toHaveText(newLabel, { timeout: 30_000 });
            });
        });
    },
);

const MNEMONIC = 'ugly rally dial movie exhibit annual bean slender illegal frown giraffe scare';
// These labels were set manually on this seed
const ACCOUNT_LABEL = 'Evolu synced BTC account';
const WALLET_INDEX = 0;
const WALLET_LABEL = 'Evolu synced wallet';
const ADDRESS = 'bc1q8aekqmmpxujx8xpgxp9mcwe6kdjpcnpzpehsmm';
const ADDRESS_LABEL = 'Evolu synced BTC address';

test.describe('Suite Sync - Labelling', { tag: ['@specificFirmware', '@T3W1', '@T3T1'] }, () => {
    test.use({
        firmwareVersion: '2-main',
        emulatorSetupConf: { mnemonic: MNEMONIC, passphrase_protection: true },
    });

    test('Sync labels from server', async ({
        page,
        target,
        devicePrompt,
        onboardingPage,
        dashboardPage,
        walletPage,
        metadataPage,
    }) => {
        await test.step('Enable Suite Sync', async () => {
            await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
            await metadataPage.initiateSuiteSyncSetup();
            if (isWebProject(target)) {
                // eslint-disable-next-line playwright/no-conditional-expect
                await expect(devicePrompt).toDisplayOnEmulator({
                    T3W1: {
                        header: { title: 'Suite Sync' },
                        body: [
                            [
                                'Allow Trezor Suite',
                                '\n',
                                'on Chrome to use',
                                '\n',
                                'Suite Sync with this',
                                '\n',
                                'Trezor?',
                            ],
                        ],
                        actions: { right_button: 'Confirm' },
                    },
                    T3T1: {
                        body: [
                            [
                                'Allow Trezor Suite to use',
                                '\n',
                                'Suite Sync with this',
                                '\n',
                                'Trezor?',
                            ],
                        ],
                    },
                });
            }
            await metadataPage.confirmSuiteSyncSetup();
        });

        await test.step('Verify BTC account label is synced', async () => {
            await walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }).click();
            await expect(
                walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
            ).toHaveText(ACCOUNT_LABEL, { timeout: 30_000 });
        });

        await test.step('Verify wallet label is synced', async () => {
            await dashboardPage.openDeviceSwitcher();
            await expect(metadataPage.wallet.walletLabel(WALLET_INDEX)).toHaveText(WALLET_LABEL);
            await dashboardPage.deviceSwitchingCloseButton.click();
        });

        await test.step('Verify address label is synced', async () => {
            await walletPage.openAccount();
            await walletPage.receiveButton.click();
            await walletPage.revealAddressButton.click();
            await devicePrompt.waitForPromptAndConfirm();
            await page.modalCloseButton.click();
            await expect(metadataPage.address.label(ADDRESS)).toHaveText(ADDRESS_LABEL);
        });
    });
});
