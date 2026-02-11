import {
    WALLET_INDEX,
    accountDescriptor,
    ownerSecret,
    walletDescriptor,
} from '../../../fixtures/metadata/default-metadata-ids';
import { isWebProject } from '../../../support/common';
import { expect, test } from '../../../support/fixtures';

const walletSeed = {
    id: 'ya1CCDTCVPyRa6egTac7yg',
    walletDescriptor,
    label: 'Evolu synced wallet',
};

const accountSeed = {
    id: 'RSZ0aKqUcO_e0WoQO32x4w',
    accountDescriptor,
    networkSymbol: 'btc',
    label: 'Evolu synced BTC account',
};

const addressSeed = {
    id: 'DmBRN-GwcRyC-cuTPczSXg',
    label: 'Evolu synced BTC address',
    address: 'bc1qkkr2uvry034tsj4p52za2pg42ug4pxg5qfxyfa',
    accountDescriptor,
    networkSymbol: 'btc',
};

test.describe(
    'Suite Sync - Labelling',
    { tag: ['@webOnly', '@specificFirmware', '@T3W1', '@T3T1'] },
    () => {
        test.use({
            deviceSetup: { passphrase_protection: true },
        });

        test.beforeEach(async ({ evoluClient, onboardingPage }) => {
            await test.step('Seed Evolu relay server', async () => {
                evoluClient.wipeAndRestartServer();
                await evoluClient.init({ ownerSecret });
                evoluClient.writeTo('wallet', walletSeed);
                evoluClient.writeTo('account', accountSeed);
                evoluClient.writeTo('address', addressSeed);
            });
            await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
        });

        test('Sync labels from server', async ({
            target,
            device,
            dashboardPage,
            walletPage,
            metadataPage,
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
                await metadataPage.confirmSuiteSyncSetup();
            });

            await test.step('Verify BTC account label is synced', async () => {
                await walletPage
                    .accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 })
                    .click();
                await expect
                    .soft(walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }))
                    .toHaveText(accountSeed.label, { timeout: 30_000 });
            });

            await test.step('Verify wallet label is synced', async () => {
                await dashboardPage.openDeviceSwitcher();
                await expect
                    .soft(metadataPage.wallet.walletLabel(WALLET_INDEX))
                    .toHaveText(walletSeed.label);
                await dashboardPage.deviceSwitchingCloseButton.click();
            });

            await test.step('Verify address label is synced', async () => {
                await walletPage.openAccount();
                await walletPage.receiveButton.click();
                await expect
                    .soft(metadataPage.address.label(addressSeed.address))
                    .toHaveText(addressSeed.label);
            });
        });
    },
);
