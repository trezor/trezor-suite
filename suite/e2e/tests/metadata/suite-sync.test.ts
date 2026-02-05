import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

import { asSuiteSyncOwnerSecretHex } from '@suite-common/suite-types';
import { asAccountDescriptor, asWalletDescriptor } from '@suite-common/wallet-types';

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

// const ownerId = getOrThrow(OwnerId.from('0Fco3XDgKR59zX5VBvyyGQ'));
const ownerSecret = asSuiteSyncOwnerSecretHex(
    'd5cafbfc837fcdba7fd54025ce352fac369db9383d41d73dbd4f3353b63bc4644585f41195021419707ccdf76bbdf0b1cb0e11f07ff19a41b5f22602dfee3b63',
);

const WALLET_SEED_INDEX = 0;
const accountDescriptor = asAccountDescriptor(
    'zpub6qSSRL9wLd6LNee7qjDEuULWccP5Vbm5nuX4geBu8zMCQBWsF5Jo5UswLVxFzcbCMr2yQPG27ZhDs1cUGKVH1RmqkG1PFHkEXyHG7EV3ogY',
);
const walletSeed = {
    id: 'ya1CCDTCVPyRa6egTac7yg',
    walletDescriptor: asWalletDescriptor('mkqRFzxmkCGX9jxgpqqFHcxRUmLJcLDBer'),
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
            firmwareVersion: '2-main',
            deviceSetup: { passphrase_protection: true },
        });

        test.beforeEach(async ({ evoluClient, onboardingPage }) => {
            await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
            await test.step('Seed Evolu relay server', async () => {
                await evoluClient.init({
                    ownerSecret,
                });
                evoluClient.writeTo('wallet', walletSeed);
                evoluClient.writeTo('account', accountSeed);
                evoluClient.writeTo('address', addressSeed);
            });
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
                    .soft(metadataPage.wallet.walletLabel(WALLET_SEED_INDEX))
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
