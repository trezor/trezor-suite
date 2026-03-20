import { ownerId } from '../../../fixtures/metadata/default-metadata-ids';
import {
    accountSeed,
    addressSeed,
    outputSeed,
    ownerSecret,
    walletSeed,
} from '../../../fixtures/metadata/suite-sync-data';
import { AccountLabelId } from '../../../support/enums/accountLabelId';
import { expect, test } from '../../../support/fixtures';

const defaultWalletIndex = 0;

test.describe('Suite Sync - Remove Labels', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ wipeEvoluRelay: true });

    test.beforeEach(async ({ evoluClient, onboardingPage }) => {
        await test.step('Seed Evolu relay server with existing labels', () => {
            evoluClient.init({ ownerSecret });
            evoluClient.writeTo('wallet', walletSeed);
            evoluClient.writeTo('account', accountSeed);
            evoluClient.writeTo('address', addressSeed);
            evoluClient.writeTo('output', outputSeed);
            evoluClient.seedQuotaManagerData();
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
            evoluClient.init({ ownerSecret });

            await evoluClient.expectInTable(
                'account',
                [
                    {
                        updatedAt: null,
                        isDeleted: null,
                        ownerId,
                        accountDescriptor: accountSeed.accountDescriptor,
                        networkSymbol: accountSeed.networkSymbol,
                        label: null,
                    },
                ],
                { softExpect: true },
            );

            await evoluClient.expectInTable(
                'wallet',
                [
                    {
                        isDeleted: null,
                        label: 'Evolu synced wallet',
                        ownerId: '0Fco3XDgKR59zX5VBvyyGQ',
                        updatedAt: null,
                        walletDescriptor: 'mkqRFzxmkCGX9jxgpqqFHcxRUmLJcLDBer',
                    },
                    {
                        updatedAt: null,
                        isDeleted: null,
                        ownerId,
                        walletDescriptor: walletSeed.walletDescriptor,
                        label: null,
                    },
                ],
                { softExpect: true },
            );

            await evoluClient.expectInTable(
                'address',
                [
                    {
                        updatedAt: null,
                        isDeleted: null,
                        ownerId,
                        accountDescriptor: addressSeed.accountDescriptor,
                        networkSymbol: addressSeed.networkSymbol,
                        address: addressSeed.address,
                        label: null,
                    },
                ],
                { softExpect: true },
            );

            await evoluClient.expectInTable(
                'output',
                [
                    {
                        updatedAt: null,
                        isDeleted: null,
                        ownerId,
                        accountDescriptor: outputSeed.accountDescriptor,
                        networkSymbol: outputSeed.networkSymbol,
                        txId: outputSeed.txId,
                        outputIndex: outputSeed.outputIndex,
                        label: null,
                    },
                ],
                { softExpect: true },
            );
        });
    });
});
