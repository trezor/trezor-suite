import { mnemonic12Fixtures } from '@suite-common/e2e-evolu-client';

import { isWebProject } from '../../../support/common';
import { expect, test } from '../../../support/fixtures';

const { accountSeed, createAddressSeed, createOutputSeed, ownerSecret, walletSeed } =
    mnemonic12Fixtures;

const defaultWalletIndex = 0;
const BTC_ADDRESS = 'bc1qkkr2uvry034tsj4p52za2pg42ug4pxg5qfxyfa';
const addressSeed = createAddressSeed(BTC_ADDRESS);
const outputSeed = createOutputSeed();

test.describe('Suite Sync - Labelling', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ wipeEvoluRelay: true });

    test.beforeEach(async ({ evoluClient, onboardingPage }) => {
        await test.step('Seed Evolu relay server', async () => {
            await evoluClient.init({ ownerSecret });
            evoluClient.writeTo('wallet', walletSeed);
            evoluClient.writeTo('account', accountSeed);
            evoluClient.writeTo('address', addressSeed);
            evoluClient.writeTo('output', outputSeed);
            evoluClient.seedQuotaManagerData({ ownerId: mnemonic12Fixtures.ownerId });
        });
        await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
    });

    test('Sync labels from server', async ({
        target,
        device,
        dashboardPage,
        walletPage,
        metadataPage,
        devicePrompt,
    }) => {
        await test.step('Enable Suite Sync', async () => {
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
            await devicePrompt.confirmSuiteSyncSetup();
        });

        await test.step('Verify BTC account label is synced', async () => {
            await walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }).click();
            await expect
                .soft(walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }))
                .toHaveText(accountSeed.label, { timeout: 30_000 });
        });

        await test.step('Verify wallet label is synced', async () => {
            await dashboardPage.openDeviceSwitcher();
            await expect
                .soft(metadataPage.wallet.walletLabel(defaultWalletIndex))
                .toHaveText(walletSeed.label);
            await dashboardPage.deviceSwitchingCloseButton.click();
        });

        await test.step('Verify address label is synced', async () => {
            await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
            await walletPage.receiveButton.click();
            await expect
                .soft(metadataPage.address.label(addressSeed.address))
                .toHaveText(addressSeed.label);
        });

        await test.step('Verify output label is synced', async () => {
            await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
            await expect
                .soft(
                    metadataPage.output.outputLabel(
                        outputSeed.txId,
                        Number(outputSeed.outputIndex),
                    ),
                )
                .toHaveText(outputSeed.label);
        });
    });
});
