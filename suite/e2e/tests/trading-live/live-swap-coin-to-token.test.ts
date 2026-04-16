import { getCryptoId } from '@suite-common/trading';
import { localizeNumber } from '@suite-common/wallet-utils';

import { expect, test } from '../../support/fixtures';

const tenMinutes = 10 * 60 * 1000;
const sendAmount = '0.053329';
const formattedSendAmount = `${localizeNumber(sendAmount)} SOL`;
const accountLabel = 'Solana #1';

// limiting number of runs due to fees onchain and nonce issues during teardown - by using specific model and FW tags
test.describe(
    'Trading - Swap coin to token',
    { tag: ['@nightlyOnly', '@specificFirmware', '@T3W1', '@webOnly'] },
    () => {
        test.setTimeout(tenMinutes);
        test.use({
            deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true },
        });
        test.beforeEach(async ({ onboardingPage, dashboardPage, walletPage, settingsPage }) => {
            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({
                enableNetworks: ['sol', 'base'],
                disableNetworks: ['btc'],
            });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE_LIVE!);

            await walletPage.openSwapTrading({ symbol: 'sol', atIndex: 0 });
        });

        test('Swap Solana to USDC', async ({ tradingPage, page, devicePrompt }) => {
            await test.step('Fill in a Swap form', async () => {
                await tradingPage.fillSwapForm({
                    amount: sendAmount,
                    sellAsset: {
                        searchFilter: 'Solana #1',
                        networkSymbol: 'sol',
                    },
                    buyAsset: {
                        searchFilter: 'USDC',
                        networkFilter: 'base',
                        tokenSymbol: 'USDC',
                        networkSymbol: 'base',
                    },

                    selectReceiveAddress: async () => {
                        await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, 'base');
                    },
                });
            });
            let receiveAmount: string;
            await test.step('Confirm the Swap trade', async () => {
                await expect(tradingPage.quotes.bestOfferAmount).toHaveText(/^\d+(\.\d+)?\s+USDC$/);
                const receiveAmountUnformated =
                    (await tradingPage.quotes.bestOfferAmount.innerText()).split(' ')[0] ?? '';
                receiveAmount = localizeNumber(receiveAmountUnformated);
                await tradingPage.waitForSolanaFeesAndClickSwapBestOffer();
            });

            await test.step('Initiate send', async () => {
                await tradingPage.confirmation.initiateSendConfirmation();
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
                await expect(tradingPage.swapToastReceiveAccount).toContainText('Base #1');
                await expect(tradingPage.swapToastSendAmount).toContainText(sendAmount);
                await expect(tradingPage.swapToastReceiveAmount).toContainText(receiveAmount);

                await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                    'TR_EXCHANGE_DETAIL_SUCCESS_TITLE',
                    { timeout: tenMinutes },
                );
                await expect(tradingPage.confirmation.cryptoAmount.first()).toHaveText(
                    formattedSendAmount,
                );
            });

            await test.step('Return to account swap form', async () => {
                await tradingPage.backToAccountButton('Swap').click();
                await expect(
                    page.getByTestId('@trading/menu/wallet-trading-transactions'),
                ).toBeVisible();
            });
        });
        test.afterEach(async ({ tradingPage, devicePrompt, walletPage }) => {
            const usdcBalanceValue = await walletPage.getTokenBalance({
                symbol: 'base',
                atIndex: 0,
                tokenName: 'USD Coin',
            });
            if (usdcBalanceValue < 20) {
                return;
            }

            const lowerUsdcBalanceValue = usdcBalanceValue - 0.5;

            await walletPage.openSwapTrading({ symbol: 'base', atIndex: 0 });
            await test.step('Fill in a Swap form', async () => {
                await tradingPage.fillSwapForm({
                    amount: lowerUsdcBalanceValue.toString(),
                    sellAsset: {
                        searchFilter: 'USDC',
                        networkSymbol: 'base',
                        tokenSymbol: 'USDC',
                    },
                    buyAsset: {
                        searchFilter: 'Solana',
                        assetCryptoId: getCryptoId('sol'),
                    },

                    selectReceiveAddress: async () => {
                        await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, 'sol');
                    },
                });
            });

            await test.step('Confirm the Swap trade', async () => {
                await expect(tradingPage.quotes.bestOfferAmount).toHaveText(/^\d+(\.\d+)?\s+SOL$/);
                await tradingPage.swapBestOfferButton.click();
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
