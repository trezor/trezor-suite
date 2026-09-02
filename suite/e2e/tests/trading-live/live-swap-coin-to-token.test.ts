import { getCryptoId } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { localizeNumber } from '@suite-common/wallet-utils';
import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

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
            await settingsPage.changeNetworks({ enableNetworks: ['sol', 'base'] });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE_LIVE!);

            await walletPage.openSwapTrading({ symbol: 'sol', atIndex: 0 });
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
                        assetCryptoId: getCryptoId(asNetworkSymbol('sol')),
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

        test(
            'Swap Solana to USDC',
            { annotation: createTestAnnotation({ stream: TestStream.Trade }) },
            async ({ tradingPage, page, devicePrompt }) => {
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
                            assetCryptoId: getCryptoId(
                                asNetworkSymbol('base'),
                                '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
                            ),
                        },

                        selectReceiveAddress: async () => {
                            await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, 'base');
                        },
                    });
                });

                let receiveAmount: string;

                await test.step('Confirm the Swap trade', async () => {
                    await expect(tradingPage.quotes.bestOfferAmount).toHaveText(
                        /^\d+(\.\d+)?\s+USDC$/,
                    );
                    const receiveAmountUnformated =
                        (await tradingPage.quotes.bestOfferAmount.innerText()).split(' ')[0] ?? '';
                    receiveAmount = localizeNumber(receiveAmountUnformated);
                    await tradingPage.waitForSolanaFeesAndClickSwapBestOffer();
                });

                await test.step('Initiate send', async () => {
                    await tradingPage.confirmation.initiateSendConfirmation();
                    await expect(devicePrompt.header.accountLabel).toHaveText(accountLabel);
                    await expect(devicePrompt.outputValueOf('address')).toHaveValidAddress('sol');

                    await expect(devicePrompt.cryptoAmountWithSymbolOf('total')).toHaveText(
                        formattedSendAmount,
                    );
                    await expect(devicePrompt.cryptoAmountOf('fee')).toHaveTextGreaterThan(0);
                });

                await test.step('Send crypto to provider', async () => {
                    await devicePrompt.sendButton.click();

                    await tradingPage.verifySwapToast({
                        sendAccount: accountLabel,
                        receiveAccount: 'Base #1',
                        sendAmount,
                        receiveAmount,
                    });

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
            },
        );
    },
);
