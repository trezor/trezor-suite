import { getCryptoId } from '@suite-common/trading';
import { localizeNumber } from '@suite-common/wallet-utils';

import { expect, test } from '../../support/fixtures';

const tenMinutes = 10 * 60 * 1000;
const sendAmount = '7.77';
const sendTokenSymbol = 'USDT';
const sendAssetName = 'Tether';
const receiveAssetName = 'Solana';
const receiveCoinSymbol = 'SOL';
const formattedSendAmount = `${localizeNumber(sendAmount)} ${sendTokenSymbol}`;
const accountLabel = 'Solana #2';

// limiting number of runs due to fees onchain and nonce issues during teardown - by using specific model and FW tags
test.describe(
    'Trading - Swap SPL token to coin via CEX',
    { tag: ['@nightlyOnly', '@specificFirmware', '@T3W1', '@webOnly'] },
    () => {
        test.setTimeout(tenMinutes);
        test.use({
            deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true },
        });
        test.beforeEach(async ({ onboardingPage, dashboardPage, walletPage, settingsPage }) => {
            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({ enableNetworks: ['sol'] });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE_LIVE!);

            await walletPage.openSwapTrading({ symbol: 'sol', atIndex: 1 });
        });

        test('Swap USDT to SOL via CEX', async ({ tradingPage, page, devicePrompt }) => {
            await test.step('Fill in a Swap form', async () => {
                await tradingPage.fillSwapForm({
                    amount: sendAmount,
                    sellAsset: {
                        networkSymbol: 'sol',
                        tokenSymbol: sendTokenSymbol,
                    },
                    buyAsset: {
                        searchFilter: receiveAssetName,
                        assetCryptoId: getCryptoId('sol'),
                    },
                    selectReceiveAddress: async () => {
                        await tradingPage.receiveAccount.selectSuiteReceiveAccount(1, 'sol');
                    },
                });
            });

            let receiveAmount: string;
            await test.step('Confirm the Swap trade', async () => {
                await expect(tradingPage.quotes.bestOfferAmount).toContainText(receiveCoinSymbol);
                const [amount] = (await tradingPage.quotes.bestOfferAmount.innerText()).split(' ');
                receiveAmount = localizeNumber(amount);
                await tradingPage.waitForSolanaFeesAndClickSwapBestOffer();
            });

            await test.step('Initiate send', async () => {
                await tradingPage.confirmation.initiateSendConfirmation({
                    confirmAlsoToken: true,
                });
                await expect(devicePrompt.headerParagraph).toContainText(accountLabel);
                await expect(devicePrompt.outputValueOf('address')).toHaveValidAddress('sol');
                await expect(devicePrompt.cryptoAmountWithSymbolOf('total')).toHaveText(
                    formattedSendAmount,
                );
                await expect(devicePrompt.cryptoAmountOf('fee')).toHaveTextGreaterThan(0);
            });

            await test.step('Send crypto to provider', async () => {
                await devicePrompt.sendButton.click();

                await expect(tradingPage.swapToastSendAccount).toContainText(accountLabel);
                await expect(tradingPage.swapToastReceiveAccount).toContainText(accountLabel);
                await expect(tradingPage.swapToastSendAmount).toContainText(sendAmount);
                await expect(tradingPage.swapToastReceiveAmount).toContainText(receiveAmount);

                await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                    'TR_EXCHANGE_DETAIL_SUCCESS_TITLE',
                    { timeout: tenMinutes },
                );
            });

            await test.step('Verify swap detail sidebar', async () => {
                // "You pay" section
                await expect
                    .soft(tradingPage.transactionDetailSidebar.sendAccount)
                    .toContainText(accountLabel);
                await expect
                    .soft(tradingPage.transactionDetailSidebar.sendAssetName)
                    .toHaveText(sendAssetName);
                await expect
                    .soft(tradingPage.transactionDetailSidebar.sendNetworkName)
                    .toHaveText(receiveAssetName);
                await expect
                    .soft(tradingPage.transactionDetailSidebar.cryptoAmounts.first())
                    .toContainText(sendAmount);
                await expect
                    .soft(tradingPage.transactionDetailSidebar.cryptoAmounts.first())
                    .toContainText(sendTokenSymbol);

                // "You get" section
                await expect
                    .soft(tradingPage.transactionDetailSidebar.receiveAccount)
                    .toContainText(accountLabel);
                await expect
                    .soft(tradingPage.transactionDetailSidebar.receiveAssetName)
                    .toHaveText(receiveAssetName);
                await expect
                    .soft(tradingPage.transactionDetailSidebar.cryptoAmounts.last())
                    .toContainText(receiveCoinSymbol);

                // Provider
                await expect.soft(tradingPage.confirmation.provider).toBeVisible();

                // Rate type (can be floating or fixed depending on provider)
                await expect.soft(tradingPage.confirmation.exchangeType).toBeVisible();
            });

            await test.step('Return to account swap form', async () => {
                await tradingPage.backToAccountButton('Swap').click();
                await expect(
                    page.getByTestId('@trading/menu/wallet-trading-transactions'),
                ).toBeVisible();
            });
        });

        test.afterEach(async ({ tradingPage, devicePrompt, walletPage }) => {
            await walletPage.openAccount({ symbol: 'sol', atIndex: 1 });
            const balanceText = await walletPage.topPanelBalance.innerText();
            const solBalance = parseFloat(balanceText);
            if (solBalance < 0.1) {
                return;
            }

            const swapBackAmount = (solBalance - 0.05).toFixed(6);

            await walletPage.openSwapTrading({ symbol: 'sol', atIndex: 1 });
            await test.step('Fill in a Swap form', async () => {
                await tradingPage.fillSwapForm({
                    amount: swapBackAmount,
                    sellAsset: {
                        searchFilter: 'Solana #2',
                        networkSymbol: 'sol',
                    },
                    buyAsset: {
                        searchFilter: sendTokenSymbol,
                        networkFilter: 'sol',
                        networkSymbol: 'sol',
                        tokenSymbol: sendTokenSymbol,
                    },
                    selectReceiveAddress: async () => {
                        await tradingPage.receiveAccount.selectSuiteReceiveAccount(1, 'sol');
                    },
                });
            });

            await test.step('Confirm the Swap trade', async () => {
                await expect(tradingPage.quotes.bestOfferAmount).toContainText(sendTokenSymbol);
                await tradingPage.waitForSolanaFeesAndClickSwapBestOffer();
            });

            await test.step('Initiate send', async () => {
                await tradingPage.confirmation.initiateSendConfirmation();
            });

            await test.step('Send crypto to provider', async () => {
                await devicePrompt.sendButton.click();
            });
        });
    },
);
