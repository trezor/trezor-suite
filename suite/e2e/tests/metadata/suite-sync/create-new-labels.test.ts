import { mnemonic12Fixtures } from '@suite-common/e2e-evolu-client';

import { AccountLabelId } from '../../../support/enums/accountLabelId';
import { expect, test } from '../../../support/fixtures';

const { buildExpectedAccount, buildExpectedAddress, buildExpectedOutput, buildExpectedWallet } =
    mnemonic12Fixtures;

const defaultWalletIndex = 0;

const expectedWallet = buildExpectedWallet({ label: 'Evolu write wallet' });
const expectedAccount = buildExpectedAccount({ label: 'Evolu write BTC account' });
const expectedAddress = buildExpectedAddress({
    address: 'bc1qkkr2uvry034tsj4p52za2pg42ug4pxg5qfxyfa',
    label: 'Evolu write BTC address',
});
const expectedOutput = buildExpectedOutput({
    txId: 'aa545d95cf07892e1ae70b40e856b9b476f703e2e20647d0985830fd7b734393',
    outputIndex: '0',
    label: 'Evolu write output',
});

test.describe('Suite Sync - Labelling', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ wipeEvoluRelay: true });

    test.beforeEach(async ({ onboardingPage, metadataPage, settingsPage }) => {
        await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await metadataPage.enableSuiteSync();
    });

    test('Create new labels', async ({ evoluClient, dashboardPage, walletPage, metadataPage }) => {
        await test.step('Change account label', async () => {
            await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
            await metadataPage.account.changeLabel({
                accountId: AccountLabelId.BitcoinDefault1,
                label: expectedAccount.label,
                confirmSuiteSync: true,
            });
            await expect
                .soft(walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }))
                .toHaveText(expectedAccount.label, { timeout: 30_000 });
        });

        await test.step('Change wallet label', async () => {
            await dashboardPage.openDeviceSwitcher();
            await metadataPage.wallet.changeLabel({
                index: defaultWalletIndex,
                label: expectedWallet.label,
            });
            await expect
                .soft(metadataPage.wallet.walletLabel(defaultWalletIndex))
                .toHaveText(expectedWallet.label);
            await dashboardPage.deviceSwitchingCloseButton.click();
        });

        await test.step('Change address label', async () => {
            await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
            await walletPage.receiveButton.click();
            await metadataPage.address.changeLabel({
                address: expectedAddress.address,
                label: expectedAddress.label,
            });
            await expect
                .soft(metadataPage.address.label(expectedAddress.address))
                .toHaveText(expectedAddress.label);
        });

        await test.step('Change output label', async () => {
            await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
            await metadataPage.output.changeLabel({
                outputId: expectedOutput.txId,
                txNumber: Number(expectedOutput.outputIndex),
                label: expectedOutput.label,
            });
            await expect(
                metadataPage.output.outputLabel(
                    expectedOutput.txId,
                    Number(expectedOutput.outputIndex),
                ),
            ).toHaveText(expectedOutput.label);
        });

        await test.step('Verify data are sync to Relay', async () => {
            await evoluClient.init({ ownerSecret: mnemonic12Fixtures.ownerSecret });
            await evoluClient.expectInTable('account', [expectedAccount], { softExpect: true });
            await evoluClient.expectInTable('address', [expectedAddress], { softExpect: true });
            await evoluClient.expectInTable('wallet', [expectedWallet], { softExpect: true });
            await evoluClient.expectInTable('output', [expectedOutput], { softExpect: true });
        });
    });
});
