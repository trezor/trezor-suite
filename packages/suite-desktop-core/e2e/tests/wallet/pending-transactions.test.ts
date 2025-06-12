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

test.describe(
    'Use regtest to test pending transactions',
    { tag: ['@group=wallet', '@desktopOnly'] },
    () => {
        test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all' } });
        test.beforeEach(async ({ page, onboardingPage, settingsPage, trezorUserEnvLink }) => {
            await test.step('Mine on regtest network', async () => {
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
                // Mining needs to happen in time before discovery
                await trezorUserEnvLink.mineBlocks({ block_amount: 1 });
                await page.waitForTimeout(5_000);
            });

            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({
                enableNetworks: ['regtest'],
                disableNetworks: ['btc'],
            });
        });

        test('Send couple of pending txs and check that they are pending until mined', async ({
            page,
            walletPage,
            devicePrompt,
            tradingPage,
            trezorUserEnvLink,
        }) => {
            await walletPage
                .accountLabel({ symbol: 'regtest', type: 'normal', atIndex: 0 })
                .click();

            await test.step('Create 2 transactions (one self, one fund another account of mine)', async () => {
                for (const [index, transaction] of [
                    accounts.account1,
                    accounts.account2,
                ].entries()) {
                    await walletPage.openSendFormButton.click();
                    await tradingPage.sendAmountInput.fill('0.3');
                    await tradingPage.sendAddressInput.fill(transaction.address);
                    await page.getByTestId('add-output').click();
                    await page.getByTestId('outputs.1.amount').fill('0.7');
                    await page.getByTestId('outputs.1.address').fill(transaction.address);
                    await tradingPage.sendButton.click();
                    await devicePrompt.waitForPromptAndConfirm(); // 1st recipient
                    await devicePrompt.waitForPromptAndConfirm(); // 2nd recipient
                    await devicePrompt.waitForFinalPromptAndConfirm(); // Summary
                    await devicePrompt.sendButton.click();

                    const pendingTransactionsList = page.getByTestId(
                        '@wallet/accounts/transaction-list/pending/group/0',
                    );
                    await expect(
                        pendingTransactionsList.getByTestId(
                            '@transaction-item/0/prepending/heading',
                        ),
                    ).toBeVisible();
                    await pendingTransactionsList
                        .getByTestId('@transaction-item/0/heading')
                        .click();

                    await expect(
                        page.getByTestId('@transaction-group/pending/count'),
                    ).toContainText((index + 1).toString());
                    const txid = await page.getByTestId('@tx-detail/txid-value').getAttribute('id');
                    if (!txid) {
                        throw new Error('Transaction ID not found');
                    }
                    transaction.txid = txid;

                    await page.getByTestId('@modal/close-button').click();
                }
            });

            await test.step('Verify account #1 has 2 pending transactions (self and sent)', async () => {
                const pendingTransactionsAccount1 = page.getByTestId(
                    '@wallet/accounts/transaction-list/pending/group/0',
                );
                await expect(
                    pendingTransactionsAccount1.getByTestId('@transaction-item/0/heading'),
                ).toContainText('Sending REGTEST');
                await expect(
                    pendingTransactionsAccount1.getByTestId('@transaction-item/1/heading'),
                ).toContainText('Sending REGTEST to myself');
            });

            await test.step('Verify account #2 has 1 pending transaction (receive)', async () => {
                await walletPage
                    .accountLabel({ symbol: 'regtest', type: 'normal', atIndex: 1 })
                    .click();
                const pendingTransactionsAccount2 = page.getByTestId(
                    '@wallet/accounts/transaction-list/pending/group/0',
                );
                await expect(
                    pendingTransactionsAccount2.getByTestId('@transaction-item/0/heading'),
                ).toContainText('Receiving REGTEST');
            });

            await test.step('Generate Block and verify account #1 transaction has NOT changed', async () => {
                await trezorUserEnvLink.generateBlock({
                    address: accounts.miner_account.address,
                    txids: [],
                });
                await page.waitForTimeout(2000);
                await walletPage
                    .accountLabel({ symbol: 'regtest', type: 'normal', atIndex: 0 })
                    .click();
                const pendingTransactionsAccount1AfterMine = page.getByTestId(
                    '@wallet/accounts/transaction-list/pending/group/0',
                );
                await expect(
                    pendingTransactionsAccount1AfterMine.getByTestId('@transaction-item/0/heading'),
                ).toContainText('Sending REGTEST');
                await expect(
                    pendingTransactionsAccount1AfterMine.getByTestId('@transaction-item/1/heading'),
                ).toContainText('Sending REGTEST to myself');
            });

            await test.step('Mine the "not-self" transaction', async () => {
                await trezorUserEnvLink.generateBlock({
                    address: accounts.miner_account.address,
                    txids: [accounts.account2.txid],
                });
            });

            await test.step('Verify sent transaction has disappeared, self transaction stays', async () => {
                const pendingTransactionsAccount1AfterMine2 = page.getByTestId(
                    '@wallet/accounts/transaction-list/pending/group/0',
                );
                await expect(
                    pendingTransactionsAccount1AfterMine2.getByTestId(
                        '@transaction-item/0/heading',
                    ),
                ).toContainText('Sending REGTEST to myself');
                await expect(page.getByTestId('@transaction-group/pending/count')).toContainText(
                    '1',
                );
            });

            await test.step('New group of transactions appears with the previously pending transaction now confirmed', async () => {
                // and new group of transactions appears with the previously pending transaction now confirmed
                const confirmedTransactionsAccount1 = page.getByTestId(
                    '@wallet/accounts/transaction-list/confirmed/group/0',
                );
                await expect(
                    confirmedTransactionsAccount1.getByTestId('@transaction-item/0/heading'),
                ).toContainText('Sent REGTEST');
            });

            await test.step('Verify receive pending transaction on account #2 is now mined as well', async () => {
                await walletPage
                    .accountLabel({ symbol: 'regtest', type: 'normal', atIndex: 1 })
                    .click();
                const confirmedTransactionsAccount2 = page.getByTestId(
                    '@wallet/accounts/transaction-list/confirmed/group/0',
                );
                await expect(
                    confirmedTransactionsAccount2.getByTestId('@transaction-item/0/heading'),
                ).toContainText('Received REGTEST');
            });

            await test.step('Verify account #3 is visible', async () => {
                await expect(
                    walletPage.accountLabel({ symbol: 'regtest', type: 'normal', atIndex: 2 }),
                ).toBeVisible();
            });
        });
    },
);
