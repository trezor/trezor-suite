import type { BuyTradeQuoteRequest } from 'invity-api';

import { getCryptoId } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';

import dump from '../../fixtures/remembered-wallet-db-lite.json';
import { tradeEndpoint } from '../../fixtures/trading';
import { expect, test } from '../../support/fixtures';
import type { IndexedDbDump } from '../../support/indexedDb';
import { createTestAnnotation } from '../../support/reporters/annotations';

const fiatAmount = '1000';
const unusedNetworkCryptoId = getCryptoId(asNetworkSymbol('ltc'));

test.describe('Trading - Buy inputs', { tag: ['@webOnly', '@noDevice', '@optional'] }, () => {
    test.use({
        startEmulator: false,
        setupEmulator: false,
    });

    test.beforeEach(async ({ page, indexedDb, walletPage }) => {
        await test.step('Wait for Suite to initialize IndexedDB schema', async () => {
            await indexedDb.waitForInit();
        });

        await test.step('Seed remembered wallet from real DB dump', async () => {
            await indexedDb.seedFromDump(dump as IndexedDbDump);
        });

        await test.step('Reload Suite with remembered state', async () => {
            await expect(page.getByTestId('@suite/loading')).toBeHidden({
                timeout: 20_000,
            });
            await expect(page.getByTestId('@suite/bundle-loader')).toBeHidden({
                timeout: 20_000,
            });
            await expect(walletPage.deviceDisconnectedStatus).toBeVisible({
                timeout: 20_000,
            });
        });
    });

    test(
        'Buy form requests new quotes when the asset or the fiat currency changes',
        { annotation: createTestAnnotation({ stream: TestStream.Trade }) },
        async ({ page, walletPage, tradingPage }) => {
            await test.step('Request quotes to buy Bitcoin', async () => {
                await walletPage.openTradingGlobalButton.click();
                await page.expectReduxObjectNotToBeEmpty('wallet.trading.buy.buyInfo', {
                    timeout: 30_000,
                });
                await tradingPage.assetPicker.selectBuyAsset({
                    searchFilter: 'Bitcoin',
                    assetCryptoId: getCryptoId(asNetworkSymbol('btc')),
                });
                await tradingPage.fillBuyForm({ amount: fiatAmount });
            });

            // Recurring bug: https://github.com/trezor/trezor-suite/issues/23851
            // Recurring bug: https://github.com/trezor/trezor-suite/issues/25766
            await test.step('Switching to an asset without a receive account requests its quotes', async () => {
                const quotesRequest = page.waitForRequest(tradeEndpoint.buyQuotes);
                await tradingPage.assetPicker.selectBuyAsset({
                    searchFilter: 'Litecoin',
                    assetCryptoId: unusedNetworkCryptoId,
                });

                const request: BuyTradeQuoteRequest = (await quotesRequest).postDataJSON();
                expect(request).toMatchObject({
                    receiveCurrency: unusedNetworkCryptoId,
                    fiatStringAmount: fiatAmount,
                });
                await expect(tradingPage.inputs.youGetAssetSymbol).toHaveText('LTC', {
                    ignoreCase: true,
                });
            });

            // Recurring bug: https://github.com/trezor/trezor-suite/issues/26406
            // Recurring bug: https://github.com/trezor/trezor-suite/issues/25613
            await test.step('Switching the fiat currency requests quotes in that currency', async () => {
                await expect(tradingPage.inputs.cryptoAmount).toHaveValue(/[1-9]/);
                const cryptoAmountInCzk = await tradingPage.inputs.cryptoAmount.inputValue();
                const quotesRequest = page.waitForRequest(tradeEndpoint.buyQuotes);
                await tradingPage.inputs.selectFiatCurrency('eur');

                const request: BuyTradeQuoteRequest = (await quotesRequest).postDataJSON();
                expect(request).toMatchObject({
                    receiveCurrency: unusedNetworkCryptoId,
                    fiatCurrency: 'EUR',
                    fiatStringAmount: fiatAmount,
                });
                await expect(tradingPage.inputs.cryptoAmount).not.toHaveValue(cryptoAmountInCzk);
            });
        },
    );
});
