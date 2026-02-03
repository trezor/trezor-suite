import { getOrThrow } from '@evolu/common';
import { OwnerId } from '@evolu/common/local-first';
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

import { asSuiteSyncOwnerSecretHex } from '@suite-common/suite-types';

import { isWebProject, skipFixture } from '../../support/common';
import { AccountLabelId } from '../../support/enums/accountLabelId';
import { expect, test } from '../../support/fixtures';
import { EvoluClient } from '../../support/helpers/evoluClient';

test.use({ exceptionLogger: skipFixture });
test.describe(
    'Suite Sync - Labelling',
    { tag: ['@webOnly', '@specificFirmware', '@T3W1', '@T3T1'] },
    () => {
        test.use({
            firmwareVersion: '2-main',
            deviceSetup: {
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
                await metadataPage.setupQuotaManager();
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
                await metadataPage.setupQuotaManager();
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
const ownerId = getOrThrow(OwnerId.from('yg0UgROParTpm60ltI3hDw'));
const ownerSecret = asSuiteSyncOwnerSecretHex(
    'e17818d7c458f171885280eeef2d70078c6842b51e18ec6f2f8c9f44d3d171fd0f49a3aeff32a560d7f823321fcd24f8d8773ffa59855c6447b11af88a2fd7b5',
);

// These labels were set manually on this seed
const ACCOUNT_LABEL = 'Evolu synced BTC account';
const WALLET_INDEX = 0;
const WALLET_LABEL = 'Evolu synced wallet';
const ADDRESS = 'bc1q8aekqmmpxujx8xpgxp9mcwe6kdjpcnpzpehsmm';
const ADDRESS_LABEL = 'Evolu synced BTC address';

test.describe('Suite Sync - Labelling', { tag: ['@specificFirmware', '@T3W1', '@T3T1'] }, () => {
    test.use({
        firmwareVersion: '2-main',
        deviceSetup: { mnemonic: MNEMONIC, passphrase_protection: true },
    });

    //TMP Test just for local demonstration purposes
    test.skip('Set label in suite and verify it on server', async ({
        page,
        onboardingPage,
        metadataPage,
        walletPage,
    }) => {
        await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
        await metadataPage.setupQuotaManager();
        await metadataPage.enableSuiteSync();

        await walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }).click();
        await metadataPage.account.clickEditLabelButton(AccountLabelId.BitcoinDefault1);
        await metadataPage.account.metadataInput.fill(ACCOUNT_LABEL);
        await page.keyboard.press('Enter');
        await expect(
            walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
        ).toHaveText(ACCOUNT_LABEL);

        const evoluClient = new EvoluClient();
        await evoluClient.init({ ownerSecret });

        await expect(async () => {
            const accountData = await evoluClient.getAccountData();
            expect(accountData).not.toEqual([]);
            expect(accountData[0].ownerId).toBe(ownerId);
            expect(accountData[0].label).toBe(ACCOUNT_LABEL);
        }).toPass({ timeout: 30_000 });
    });

    // TODO: Temporarily skipping the test due to work in progress
    test.skip('Sync labels from server', async ({
        page,
        target,
        device,
        devicePrompt,
        onboardingPage,
        dashboardPage,
        walletPage,
        metadataPage,
    }) => {
        await test.step('Enable Suite Sync', async () => {
            await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
            await metadataPage.setupQuotaManager();
            await metadataPage.initiateSuiteSyncSetup();
            if (isWebProject(target)) {
                // eslint-disable-next-line playwright/no-conditional-expect
                await expect(device).toShowOnDisplay({
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
