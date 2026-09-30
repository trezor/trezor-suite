import type { SellFiatTradeQuoteRequest } from 'invity-api';

import { messages } from '@suite/intl';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';
import { localizeNumber } from '@trezor/utils';

import { tradeEndpoint } from '../../fixtures/trading';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const btcSymbol = asNetworkSymbol('btc');
const solSymbol = asNetworkSymbol('sol');

const solanaBalanceAddress = '41baq3croaLZEj8dPWZnXn8e6xdAtvtWu2h941vm3Ngw';
const customFeeRate = 1;
const cryptoAmount = '0.001';
const fiatAmount = '100';
const baseCurrencyAmount = '10';
const receivedQuotesEvent = 'trade/received-quotes';
let bitcoinBalance: string;
let solanaBalance: string;

test.describe('Trading - Sell inputs', { tag: ['@T3W1', '@T3T1', '@optional'] }, () => {
    test.use({
        deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true },
    });

    test.beforeEach(async ({ onboardingPage, dashboardPage, settingsPage, solanaStakingMock }) => {
        await onboardingPage.completeOnboarding();

        solanaStakingMock.setBalance(solanaBalanceAddress, 5_000_000_000);

        await test.step('Enable Bitcoin and Solana', async () => {
            await settingsPage.changeNetworks({
                enableNetworks: [
                    btcSymbol,
                    { symbol: solSymbol, backend: { type: 'solana', url: solanaStakingMock.url } },
                ],
            });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
        });
    });

    test(
        'Sell form % inputs and limits',
        { annotation: createTestAnnotation({ stream: TestStream.Trade }) },
        async ({ page, walletPage, tradingPage, analyticsHelper }) => {
            await test.step('Find out btc and sol balances', async () => {
                await walletPage.openAccount({ symbol: btcSymbol });
                await expect(walletPage.topPanelBalance).toHaveText(/\d/);
                bitcoinBalance = await walletPage.topPanelBalance.innerText();
                await walletPage.openAccount({ symbol: solSymbol });
                await expect(walletPage.topPanelBalance).toHaveText(/\d/);
                solanaBalance = await walletPage.topPanelBalance.innerText();
                await walletPage.openTrading();
                await tradingPage.sellTabButton.click();
                const worldwideOption = messages['TR_TRADING_COUNTRY_WORLD'].defaultMessage;
                await expect(tradingPage.inputs.countryValue).not.toHaveText(worldwideOption);
            });

            await test.step('Check limits for BTC input', async () => {
                await test.step('Too many decimal digits', async () => {
                    await tradingPage.inputs.cryptoAmount.fill('0.000000001');
                    await expect
                        .soft(tradingPage.inputs.youPayError)
                        .toHaveTranslation('AMOUNT_IS_NOT_IN_RANGE_DECIMALS', {
                            values: { decimals: '8' },
                            timeout: 15_000,
                        });
                });

                await test.step('Not enough funds', async () => {
                    await tradingPage.inputs.cryptoAmount.fill('10');
                    await expect
                        .soft(tradingPage.inputs.youPayError)
                        .toHaveTranslation('AMOUNT_IS_NOT_ENOUGH', { timeout: 15_000 });
                });

                await tradingPage.inputs.cryptoAmount.clear();
                await expect.soft(tradingPage.inputs.youPayError).toBeHidden();
            });

            await test.step('Fiat error shows on the You get card, not You pay', async () => {
                await tradingPage.inputs.fiatAmount.fill('10.123');
                await expect(tradingPage.inputs.youGetError).toHaveTranslation(
                    'AMOUNT_IS_NOT_IN_RANGE_DECIMALS',
                    { values: { decimals: '2' } },
                );
                await expect(tradingPage.inputs.youPayError).toBeHidden();

                await tradingPage.inputs.fiatAmount.clear();
                await expect(tradingPage.inputs.youGetError).toBeHidden();
                await expect(tradingPage.inputs.youPayError).toBeHidden();
            });

            await test.step('Crypto entry reports input=crypto', async () => {
                const event = analyticsHelper.waitForEvent({
                    c_type: receivedQuotesEvent,
                    input: 'crypto',
                });
                await tradingPage.inputs.cryptoAmount.fill(cryptoAmount);
                await event;
            });

            await test.step('Fiat entry requests quotes in fiat and refills crypto', async () => {
                await tradingPage.inputs.selectFiatCurrency('eur');
                const quotesRequest = page.waitForRequest(tradeEndpoint.sellQuotes);
                const event = analyticsHelper.waitForEvent({
                    c_type: receivedQuotesEvent,
                    input: 'fiat',
                });
                await tradingPage.inputs.fiatAmount.fill(fiatAmount);

                const request: SellFiatTradeQuoteRequest = (await quotesRequest).postDataJSON();
                expect(request.amountInCrypto).toBe(false);
                expect(request.fiatStringAmount).toBe(fiatAmount);
                await expect(tradingPage.inputs.cryptoAmount).toHaveValue(/[1-9]/);
                await page.expectReduxObjectNotToBeEmpty('wallet.trading.composedTransactionInfo');
                await event;
            });

            await test.step('Base currency amount converts to the crypto the sell requests', async () => {
                const quotesRequest = page.waitForRequest(tradeEndpoint.sellQuotes);
                const event = analyticsHelper.waitForEvent({
                    c_type: receivedQuotesEvent,
                    input: 'base-currency',
                });
                await tradingPage.inputs.baseCurrencyAmount.fill(baseCurrencyAmount);

                const request: SellFiatTradeQuoteRequest = (await quotesRequest).postDataJSON();
                const requestedCryptoAmount = await tradingPage.inputs.cryptoAmount.inputValue();
                expect(request.amountInCrypto).toBe(true);
                expect(request.cryptoStringAmount).toBe(requestedCryptoAmount.replace(/,/g, ''));
                await expect(tradingPage.inputs.baseCurrencyAmount).toHaveValue(baseCurrencyAmount);
                await event;
            });

            await test.step('Try all % inputs for Bitcoin', async () => {
                await tradingPage.inputs.selectFiatCurrency('eur');
                const fractionEvent = analyticsHelper.waitForEvent({
                    c_type: receivedQuotesEvent,
                    input: 'fraction',
                });
                for (const percentage of [25, 50]) {
                    await test.step(`${percentage}% of BTC balance`, async () => {
                        await tradingPage.inputs.fractionButtons
                            .getByRole('button', { name: percentage + '%' })
                            .click();
                        await tradingPage.inputs.expectInputToBe({
                            percentage,
                            balance: bitcoinBalance,
                            symbol: btcSymbol,
                        });
                    });
                }
                await fractionEvent;
                await tradingPage.quotes.waitForSync();
                await tradingPage.fees.switchToCustom();
                await tradingPage.fees.customInput.fill(customFeeRate.toString());

                await test.step('Max of BTC balance', async () => {
                    await tradingPage.inputs.fractionButtons
                        .getByRole('button', { name: 'Max' })
                        .click();
                    await expect
                        .soft(async () => {
                            const resultingFee = await tradingPage.fees.maxFee.innerText();
                            const maxValue = (
                                parseFloat(bitcoinBalance) - parseFloat(resultingFee)
                            ).toString();
                            await expect(tradingPage.inputs.cryptoAmount).toHaveValue(
                                localizeNumber(maxValue, 'en-US', 0, 8),
                            );
                        })
                        .toPass({ timeout: 15_000 });
                });
            });

            await test.step('Try all % inputs on Solana', async () => {
                await walletPage.openAccount({ symbol: solSymbol, atIndex: 0 });
                await tradingPage.sellTabButton.click();
                await expect(tradingPage.inputs.youPayAssetSymbol).toHaveText('SOL');
                await tradingPage.inputs.selectFiatCurrency('eur');

                for (const percentage of [25, 50]) {
                    await test.step(`${percentage}% of Solana balance`, async () => {
                        await page.getByRole('button', { name: percentage + '%' }).click();
                        await tradingPage.inputs.expectInputToBe({
                            percentage,
                            balance: solanaBalance,
                            symbol: solSymbol,
                        });
                    });
                }

                //TODO: Bug in production
                // await test.step('Max of Solana balance', async () => {
                //     await page.getByRole('button', { name: 'Max' }).click();
                //     const resultingFee = await tradingPage.fees.getSolanaFee();
                //     const maxValue = (parseFloat(solanaBalance!) - resultingFee).toString();
                //     await expect
                //         .soft(tradingPage.inputs.cryptoAmount)
                //         .toHaveValue(localizeNumber(maxValue, 'en-US', 0, 9));
                // });
            });
        },
    );
});
