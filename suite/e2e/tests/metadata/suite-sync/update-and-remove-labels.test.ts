import { mnemonic12Fixtures } from '@suite-common/e2e-evolu-client';
import { TestStream } from '@trezor/e2e-utils';

import { AccountLabelId } from '../../../support/enums/accountLabelId';
import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

const {
    accountSeed,
    buildExpectedAccount,
    buildExpectedAddress,
    buildExpectedOutput,
    buildExpectedWallet,
    createAddressSeed,
    createOutputSeed,
    ownerSecret,
    walletSeed,
} = mnemonic12Fixtures;

const defaultWalletIndex = 0;

const BTC_ADDRESS = 'bc1qkkr2uvry034tsj4p52za2pg42ug4pxg5qfxyfa';
const addressSeed = createAddressSeed(BTC_ADDRESS);
const outputSeed = createOutputSeed();
const updatedAccountLabel = 'Evolu updated BTC account';
const updatedWalletLabel = 'Evolu updated wallet';
const updatedAddressLabel = 'Evolu updated BTC address';
const updatedOutputLabel = 'Evolu updated output';
const expectedUpdatedAccount = buildExpectedAccount({ label: updatedAccountLabel });
const expectedUpdatedWallet = buildExpectedWallet({ label: updatedWalletLabel });
const expectedUpdatedAddress = buildExpectedAddress({
    address: addressSeed.address,
    label: updatedAddressLabel,
});
const expectedUpdatedOutput = buildExpectedOutput({
    txId: outputSeed.txId,
    outputIndex: outputSeed.outputIndex,
    label: updatedOutputLabel,
});
const expectedAccount = buildExpectedAccount({ label: null });
const expectedWallet = buildExpectedWallet({ label: null });
const expectedAddress = buildExpectedAddress({ address: addressSeed.address, label: null });
const expectedOutput = buildExpectedOutput({
    txId: outputSeed.txId,
    outputIndex: outputSeed.outputIndex,
    label: null,
});

test.describe('Suite Sync - Update and Remove Labels', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ wipeEvoluRelay: true });

    test.beforeEach(async ({ evoluClient, onboardingPage, settingsPage }) => {
        await test.step('Seed Evolu relay server with existing labels', async () => {
            await evoluClient.init({ ownerSecret });
            evoluClient.writeTo('wallet', walletSeed);
            evoluClient.writeTo('account', accountSeed);
            evoluClient.writeTo('address', addressSeed);
            evoluClient.writeTo('output', outputSeed);
            evoluClient.seedQuotaManagerData({ ownerId: mnemonic12Fixtures.ownerId });
        });

        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('application');
        await settingsPage.toggleDebugModeInSettings();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
    });

    test(
        'Update and remove labels syncs correctly to relay',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ evoluClient, dashboardPage, walletPage, metadataPage }) => {
            await test.step('Enable Suite Sync and sync labels from relay', async () => {
                await metadataPage.enableSuiteSync();
                await expect
                    .soft(walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }))
                    .toHaveText(accountSeed.label, { timeout: 30_000 });
            });

            await test.step('Update account label', async () => {
                await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
                await metadataPage.account.changeLabel({
                    accountId: AccountLabelId.BitcoinDefault1,
                    label: updatedAccountLabel,
                });
                await expect
                    .soft(walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }))
                    .toHaveText(updatedAccountLabel);
            });

            await test.step('Update wallet label', async () => {
                await dashboardPage.openDeviceSwitcher();
                await metadataPage.wallet.changeLabel({
                    index: defaultWalletIndex,
                    label: updatedWalletLabel,
                });
                await expect
                    .soft(metadataPage.wallet.walletLabel(defaultWalletIndex))
                    .toHaveText(updatedWalletLabel);
                await dashboardPage.deviceSwitchingCloseButton.click();
            });

            await test.step('Update address label', async () => {
                await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
                await walletPage.receiveButton.click();
                await metadataPage.address.changeLabel({
                    address: addressSeed.address,
                    label: updatedAddressLabel,
                });
                await expect
                    .soft(metadataPage.address.label(addressSeed.address))
                    .toHaveText(updatedAddressLabel);
            });

            await test.step('Update output label', async () => {
                await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
                await metadataPage.output.changeLabel({
                    outputId: outputSeed.txId,
                    txNumber: Number(outputSeed.outputIndex),
                    label: updatedOutputLabel,
                });
                await expect(
                    metadataPage.output.outputLabel(
                        outputSeed.txId,
                        Number(outputSeed.outputIndex),
                    ),
                ).toHaveText(updatedOutputLabel);
            });

            await test.step('Verify updated labels are synced to relay', async () => {
                await evoluClient.init({ ownerSecret: mnemonic12Fixtures.ownerSecret });
                await evoluClient.expectInTable('account', [expectedUpdatedAccount], {
                    softExpect: true,
                });
                await evoluClient.expectInTable('wallet', [expectedUpdatedWallet], {
                    softExpect: true,
                });
                await evoluClient.expectInTable('address', [expectedUpdatedAddress], {
                    softExpect: true,
                });
                await evoluClient.expectInTable('output', [expectedUpdatedOutput], {
                    softExpect: true,
                });
            });

            await test.step('Remove account label', async () => {
                await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
                await metadataPage.account.removeLabel({
                    accountId: AccountLabelId.BitcoinDefault1,
                });
                await expect
                    .soft(walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }))
                    .toHaveText('Bitcoin #1');
            });

            await test.step('Remove wallet label', async () => {
                await dashboardPage.openDeviceSwitcher();
                await metadataPage.wallet.removeLabel({ index: defaultWalletIndex });
                await expect
                    .soft(metadataPage.wallet.walletLabel(defaultWalletIndex))
                    .toHaveText('Standard wallet');
                await dashboardPage.deviceSwitchingCloseButton.click();
            });

            await test.step('Remove address label', async () => {
                await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
                await walletPage.receiveButton.click();
                await metadataPage.address.removeLabel({ address: addressSeed.address });
                await expect
                    .soft(metadataPage.address.addressHoverContainer(addressSeed.address))
                    .toHaveText('bc1q kkr2 ... qfxy fa');
            });

            await test.step('Remove output label', async () => {
                await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
                await metadataPage.output.removeLabel({
                    outputId: outputSeed.txId,
                    txNumber: Number(outputSeed.outputIndex),
                });
                await expect(
                    metadataPage.output.outputLabel(
                        outputSeed.txId,
                        Number(outputSeed.outputIndex),
                    ),
                ).toHaveText('bc1q lzk7 ... ntm5 xq');
            });

            await test.step('Verify labels are removed in relay (label is null)', async () => {
                await evoluClient.init({ ownerSecret: mnemonic12Fixtures.ownerSecret });

                await evoluClient.expectInTable('account', [expectedAccount], { softExpect: true });
                await evoluClient.expectInTable('wallet', [expectedWallet], { softExpect: true });
                await evoluClient.expectInTable('address', [expectedAddress], { softExpect: true });
                await evoluClient.expectInTable('output', [expectedOutput], { softExpect: true });
            });
        },
    );
});
