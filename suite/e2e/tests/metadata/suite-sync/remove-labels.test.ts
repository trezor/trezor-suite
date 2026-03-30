import { mnemonic12Fixtures } from '@suite-common/e2e-evolu-client';

import { AccountLabelId } from '../../../support/enums/accountLabelId';
import { expect, test } from '../../../support/fixtures';

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
const expectedAccount = buildExpectedAccount({ label: null });
const expectedWallet = buildExpectedWallet({ label: null });
const expectedAddress = buildExpectedAddress({ address: addressSeed.address, label: null });
const expectedOutput = buildExpectedOutput({
    txId: outputSeed.txId,
    outputIndex: outputSeed.outputIndex,
    label: null,
});

test.describe('Suite Sync - Remove Labels', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ wipeEvoluRelay: true });

    test.beforeEach(async ({ evoluClient, onboardingPage }) => {
        await test.step('Seed Evolu relay server with existing labels', () => {
            evoluClient.init({ ownerSecret });
            evoluClient.writeTo('wallet', walletSeed);
            evoluClient.writeTo('account', accountSeed);
            evoluClient.writeTo('address', addressSeed);
            evoluClient.writeTo('output', outputSeed);
            evoluClient.seedQuotaManagerData({ ownerId: mnemonic12Fixtures.ownerId });
        });

        await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
    });

    test('Remove labels syncs null to relay', async ({
        evoluClient,
        dashboardPage,
        walletPage,
        metadataPage,
    }) => {
        await test.step('Enable Suite Sync and sync labels from relay', async () => {
            await metadataPage.enableSuiteSync();
            await expect
                .soft(walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }))
                .toHaveText(accountSeed.label, { timeout: 30_000 });
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
                metadataPage.output.outputLabel(outputSeed.txId, Number(outputSeed.outputIndex)),
            ).toHaveText('bc1q lzk7 ... ntm5 xq');
        });

        await test.step('Verify labels are removed in relay (label is null)', async () => {
            evoluClient.init({ ownerSecret: mnemonic12Fixtures.ownerSecret });

            await evoluClient.expectInTable('account', [expectedAccount], { softExpect: true });
            await evoluClient.expectInTable('wallet', [expectedWallet], { softExpect: true });
            await evoluClient.expectInTable('address', [expectedAddress], { softExpect: true });
            await evoluClient.expectInTable('output', [expectedOutput], { softExpect: true });
        });
    });
});
