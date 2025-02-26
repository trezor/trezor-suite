import { expect, test } from '../../support/fixtures';
const accounts = {
    account1: {
        address: 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v',
        txid: '',
    },
    account2: {
        address: 'bcrt1q7r9yvcdgcl6wmtta58yxf29a8kc96jkyyk8fsw',
        txid: '',
    },
    miner_account: {
        // "miner" account
        address: 'bcrt1q3j2fqzfqndv4gxhf9q0nvvxgceur8mhum8xpwj',
        txid: '',
    },
};

test.describe('Use regtest to test pending transactions', { tag: ['@group=wallet'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all' } });
    test.beforeEach(async ({ onboardingPage, dashboardPage, settingsPage, trezorUserEnvLink }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();

        await settingsPage.navigateTo('coins');
        await settingsPage.coins.disableNetwork('btc');
        await settingsPage.coins.enableNetwork('regtest');

        const payments = [
            { address: accounts.account1.address, amount: 10 },
            { address: accounts.account2.address, amount: 10 },
        ];

        for (const payment of payments) {
            await trezorUserEnvLink.sendToAddressAndMineBlock({
                address: payment.address,
                btc_amount: payment.amount,
            });
        }
        await trezorUserEnvLink.mineBlocks({ block_amount: 1 });
    });

    test('Send couple of pending txs and check that they are pending until mined', async ({
        page,
        walletPage,
        dashboardPage,
        devicePrompt,
        marketPage,
        trezorUserEnvLink,
    }) => {
        await dashboardPage.dashboardMenuButton.click();
        await walletPage.accountLabel({ symbol: 'regtest', type: 'normal', atIndex: 0 }).click();

        // create 2 transactions (one self, one fund another account of mine)
        for (const [index, transaction] of [accounts.account1, accounts.account2].entries()) {
            await walletPage.openSendFormButton.click();
            await marketPage.sendAmountInput.fill('0.3');
            await marketPage.sendAddressInput.fill(transaction.address);
            await page.getByTestId('add-output').click();
            await page.getByTestId('outputs.1.amount').fill('0.7');
            await page.getByTestId('outputs.1.address').fill(transaction.address);
            await marketPage.sendButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressYes();
            await trezorUserEnvLink.pressYes();
            await trezorUserEnvLink.pressYes();
            await trezorUserEnvLink.pressYes();
            await trezorUserEnvLink.pressYes();
            await devicePrompt.sendButton.click();

            const pendingTransactionsList = page.getByTestId(
                '@wallet/accounts/transaction-list/pending/group/0',
            );
            await expect(
                pendingTransactionsList.getByTestId('@transaction-item/0/prepending/heading'),
            ).toBeVisible();
            await pendingTransactionsList.getByTestId('@transaction-item/0/heading').click();

            await expect(page.getByTestId('@transaction-group/pending/count')).toContainText(
                (index + 1).toString(),
            );
            transaction.txid =
                (await page.getByTestId('@tx-detail/txid-value').getAttribute('id')) ?? '';

            await page.getByTestId('@modal/close-button').click();
        }

        // account 1 has 2 pending transactions (self and sent)
        const pendingTransactionsAccount1 = page.getByTestId(
            '@wallet/accounts/transaction-list/pending/group/0',
        );
        await expect(
            pendingTransactionsAccount1.getByTestId('@transaction-item/0/heading'),
        ).toContainText('Sending REGTEST');
        await expect(
            pendingTransactionsAccount1.getByTestId('@transaction-item/1/heading'),
        ).toContainText('Sending REGTEST to myself');

        // account 2 has 1 pending transaction (receive)
        await walletPage.accountLabel({ symbol: 'regtest', type: 'normal', atIndex: 1 }).click();
        const pendingTransactionsAccount2 = page.getByTestId(
            '@wallet/accounts/transaction-list/pending/group/0',
        );
        await expect(
            pendingTransactionsAccount2.getByTestId('@transaction-item/0/heading'),
        ).toContainText('Receiving REGTEST');

        await trezorUserEnvLink.generateBlock({
            address: accounts.miner_account.address,
            txids: [],
        });
        await page.waitForTimeout(2000);

        // nothing has changed
        await walletPage.accountLabel({ symbol: 'regtest', type: 'normal', atIndex: 0 }).click();
        const pendingTransactionsAccount1AfterMine = page.getByTestId(
            '@wallet/accounts/transaction-list/pending/group/0',
        );
        await expect(
            pendingTransactionsAccount1AfterMine.getByTestId('@transaction-item/0/heading'),
        ).toContainText('Sending REGTEST');
        await expect(
            pendingTransactionsAccount1AfterMine.getByTestId('@transaction-item/1/heading'),
        ).toContainText('Sending REGTEST to myself');

        // mine the "not-self" transaction
        await trezorUserEnvLink.generateBlock({
            address: accounts.miner_account.address,
            txids: [accounts.account2.txid],
        });

        // which causes sent transaction to disappear, self transaction stays
        const pendingTransactionsAccount1AfterMine2 = page.getByTestId(
            '@wallet/accounts/transaction-list/pending/group/0',
        );
        await expect(
            pendingTransactionsAccount1AfterMine2.getByTestId('@transaction-item/0/heading'),
        ).toContainText('Sending REGTEST to myself');
        await expect(page.getByTestId('@transaction-group/pending/count')).toContainText('1');

        // and new group of transactions appears with the previously pending transaction now confirmed
        const confirmedTransactionsAccount1 = page.getByTestId(
            '@wallet/accounts/transaction-list/confirmed/group/0',
        );
        await expect(
            confirmedTransactionsAccount1.getByTestId('@transaction-item/0/heading'),
        ).toContainText('Sent REGTEST');

        // receive pending transaction on account2 is now mined as well
        await walletPage.accountLabel({ symbol: 'regtest', type: 'normal', atIndex: 1 }).click();
        const confirmedTransactionsAccount2 = page.getByTestId(
            '@wallet/accounts/transaction-list/confirmed/group/0',
        );
        await expect(
            confirmedTransactionsAccount2.getByTestId('@transaction-item/0/heading'),
        ).toContainText('Received REGTEST');
    });
});
