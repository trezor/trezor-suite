import {
    accountDescriptor,
    ownerId,
    ownerSecret,
    walletDescriptor,
} from '../../../fixtures/metadata/default-metadata-ids';
import { AccountLabelId } from '../../../support/enums/accountLabelId';
import { expect, test } from '../../../support/fixtures';

const defaultWalletIndex = 0;
const expectedWallet = {
    updatedAt: null,
    isDeleted: null,
    ownerId,
    walletDescriptor,
    label: 'Evolu write wallet',
};

const expectedAccount = {
    updatedAt: null,
    isDeleted: null,
    ownerId,
    accountDescriptor,
    networkSymbol: 'btc',
    label: 'Evolu write BTC account',
};

const expectedAddress = {
    updatedAt: null,
    isDeleted: null,
    ownerId,
    accountDescriptor,
    label: 'Evolu write BTC address',
    address: 'bc1qkkr2uvry034tsj4p52za2pg42ug4pxg5qfxyfa',
    networkSymbol: 'btc',
};

const expectedOutput = {
    isDeleted: null,
    updatedAt: null,
    ownerId,
    accountDescriptor,
    label: 'Evolu write output',
    networkSymbol: 'btc',
    outputIndex: '0',
    txId: 'aa545d95cf07892e1ae70b40e856b9b476f703e2e20647d0985830fd7b734393',
};

test.describe('Suite Sync - Labelling', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({ wipeEvoluRelay: true });

    test.beforeEach(async ({ onboardingPage, metadataPage }) => {
        await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
        await metadataPage.setupQuotaManager();
        await metadataPage.enableSuiteSync();
    });

    test('Create new labels', async ({
        evoluClient,
        dashboardPage,
        walletPage,
        metadataPage,
        page,
    }) => {
        await test.step('Change account label', async () => {
            await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
            await metadataPage.account.changeLabel({
                accountId: AccountLabelId.BitcoinDefault1,
                label: expectedAccount.label,
            });
        });

        await test.step('Verify account label is set in all places', async () => {
            await expect
                .soft(walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }))
                .toHaveText(expectedAccount.label, { timeout: 30_000 });

            await page.getByTestId('@wallet/menu/wallet-receive').click();
            await page.getByTestId('@wallet/receive/reveal-address-button').click();
            await page.pause();
            await expect(page.getByTestId('@modal/header-paragraph')).toHaveText(
                expectedAccount.label,
            );
            await page.getByTestId('@modal/close-button').click();
            await page.getByTestId('@account-subpage/back').click();
            await page.getByTestId('@wallet/menu/wallet-send').click();
            await page.getByTestId('@wallet/send/debug-sent-to-myself-button').click();
            await expect(page.getByTestId('outputs.0.address/bottom-text')).toHaveText(
                expectedAccount.label,
            );
        });
        // we need to think about how to handle toasts
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
            // TODO: we want to add this to different test - probably multi-wallet test, its a bug but will take some time to fix because its not prio
            // await expect(page.getByTestId('@deviceStatus-connected')).toHaveText(expectedWallet.label);
            await page.pause();
        });

        // TODO: we want to expand this section to also verify every possible place (receive modal, tx history, coin control, buy sell swap) where wallet label is displayed, same thing with outpul labels as well.

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
        // TODO: we need to move this test to a wallet with funds for coinjoin address verification

        await page.getByTestId('@wallet/receive/reveal-address-button/1').click();
        await expect(
            page.getByTestId('@modal/output-address').getByTestId('@metadata/input'),
        ).toContainText('Evolu write BTC address');
        await page.getByTestId('@modal/close-button').click();
        await page.getByTestId('@account-menu/btc/normal/0').click();

        // we need money for coin control verification
        // need to have ETH or anything else enabled to be able to check address label in buy/sell/swap
        // await page.getByTestId('@wallet/menu/wallet-send').click();
        // await page.getByTestId('coin-control-button').click();
        await page.getByTestId('@suite/menu/suite-index').click();
        await page.getByTestId('@wallet/menu/wallet-trading-buy').click();
        await expect(page.getByTestId('@trading/selected-receive-account')).toContainText(
            'Evolu write BTC account',
        );
        await page.getByTestId('@trading/form/select-crypto-for-buy/input').click();
        await page
            .getByTestId('@trading/form/select-crypto-for-buy/top-assets')
            .getByRole('button', { name: 'BTC' })
            .click();
        await expect(page.getByTestId('@trading/selected-receive-account')).toContainText(
            'Evolu write BTC account',
        );
        await page.getByText('Evolu write BTC account0 BTC$').click();
        await expect(page.getByTestId('@trading/bitcoin-receive-address-modal')).toContainText(
            'bc1q kkr2 ... qfxy fa',
        );

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
            await evoluClient.init({ ownerSecret });
            await evoluClient.expectInTable('account', [expectedAccount], { softExpect: true });
            await evoluClient.expectInTable('address', [expectedAddress], { softExpect: true });
            await evoluClient.expectInTable('wallet', [expectedWallet], { softExpect: true });
            await evoluClient.expectInTable('output', [expectedOutput], { softExpect: true });
        });
    });
});
