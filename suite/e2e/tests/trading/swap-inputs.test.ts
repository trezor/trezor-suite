import { getCryptoId } from '@suite-common/trading';
import type { NetworkSymbol } from '@suite-common/wallet-config';

import dump from '../../fixtures/remembered-wallet-db-lite.json';
import { expect, test } from '../../support/fixtures';
import type { IndexedDbDump } from '../../support/indexedDb';
import type { TradingPage } from '../../support/pageObjects/trading/tradingPage';

const fundedSymbol = 'eth' as const;
const insufficientCryptoAmount = '1000';
const insufficientFiatAmount = '1000000';

const sellBalance = '58.72333';
const sellDecimals = 6;
const amount = '37.12345';

// Each "To" asset and the Suite receive network expected for it.
const buyAssets: {
    label: string;
    buy: Parameters<TradingPage['assetPicker']['selectBuyAsset']>[0];
    receiveNetwork: NetworkSymbol;
    accountIndex: number;
}[] = [
    {
        label: 'ETH@ETH',
        buy: { searchFilter: 'Ethereum', assetCryptoId: getCryptoId('eth') },
        receiveNetwork: 'eth',
        accountIndex: 0,
    },
    {
        label: 'USDC@SOL',
        buy: {
            searchFilter: 'USDC',
            networkFilter: 'sol',
            assetCryptoId: getCryptoId('sol', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        },
        receiveNetwork: 'sol',
        accountIndex: 1,
    },
    {
        label: 'USDT@ETH',
        buy: {
            searchFilter: 'USDT',
            networkFilter: 'eth',
            assetCryptoId: getCryptoId('eth', '0xdac17f958d2ee523a2206206994597c13d831ec7'),
        },
        receiveNetwork: 'eth',
        accountIndex: 0,
    },
    {
        label: 'ETH@ETH',
        buy: {
            searchFilter: 'ETH',
            networkFilter: 'eth',
            assetCryptoId: getCryptoId('eth'),
        },
        receiveNetwork: 'eth',
        accountIndex: 0,
    },
];

test.describe('Trading - Swap inputs', { tag: ['@webOnly', '@noDevice'] }, () => {
    test.use({
        startEmulator: false,
        setupEmulator: false,
    });

    test.describe.configure({ timeout: 3 * 60 * 1000 });

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

    test('Swap form inputs validation', async ({ walletPage, tradingPage }) => {
        await test.step('Open the funded account and open the Swap form', async () => {
            await walletPage.openAccount({ symbol: fundedSymbol });
            await walletPage.swapButton.click();
            await tradingPage.verifySwapFormOpened(/Ethereum/);
        });

        await test.step('Select sell asset USDC@ETH)', async () => {
            await tradingPage.assetPicker.selectSellAsset({
                searchFilter: 'USDC',
                networkSymbol: 'eth',
                tokenSymbol: 'USDC',
            });
        });

        for (const [index, asset] of buyAssets.entries()) {
            await test.step(`[${asset.label}] Select buy asset and fill amount`, async () => {
                await tradingPage.assetPicker.selectBuyAsset(asset.buy);
                await tradingPage.inputs.cryptoAmount.fill(amount);
                await tradingPage.quotes.waitForSync();
            });

            // The form is now fully filled, so the read-only assertions about its
            // resulting state (ticker, amount, offer, provider, fees) all run together.
            await test.step(`[${asset.label}] Verify filled form state`, async () => {
                await expect(tradingPage.inputs.swapAmountCurrencyTicker).toHaveText('USDC', {
                    ignoreCase: true,
                });
                await expect(tradingPage.inputs.cryptoAmount).toHaveValue(amount);
                await expect(
                    tradingPage.inputs.bottomText,
                    `[${asset.label}] amount ${amount} is outside the live swap limits; adjust the test amount.`,
                ).toBeHidden();

                await expect(tradingPage.quotes.bestOfferAmount).not.toHaveText(/^0( \w+)?$/, {
                    timeout: 15_000,
                });
                await expect(tradingPage.quotes.selectedProvider).toBeVisible();
                await expect(tradingPage.quotes.selectedProviderName).not.toBeEmpty();

                await tradingPage.fees.waitToBeCalculated();
                await expect(tradingPage.fees.maxFee).toBeVisible();
                await expect(tradingPage.fees.maxFee).not.toBeEmpty();
            });

            await test.step(`[${asset.label}] Change provider`, async () => {
                await tradingPage.quotes.chooseDifferentOfferIfAvailable();
            });

            await test.step(`[${asset.label}] Select receive account`, async () => {
                await tradingPage.receiveAccount.selectSuiteReceiveAccount(
                    asset.accountIndex,
                    asset.receiveNetwork,
                );
            });

            // We want to run the "the fraction / Max / amount limits" asserts only once in this loop.
            // No value in testing it multiple times with different "Swap to Asset network"
            if (index > 0) {
                continue;
            }

            await test.step('Verify fraction buttons', async () => {
                await tradingPage.inputs.verifyFractionButtons(sellBalance, sellDecimals);
            });

            await test.step('Verify Max amount (full token balance)', async () => {
                await tradingPage.inputs.fractionButtons
                    .getByRole('button', { name: 'Max' })
                    .click();
                await expect(tradingPage.inputs.cryptoAmount).toHaveValue(sellBalance);
            });

            await test.step('Verify amount limits and fiat input', async () => {
                await tradingPage.inputs.verifyCryptoAmountExceedsBalance(insufficientCryptoAmount);
                await tradingPage.inputs.verifyFiatAmountExceedsBalance(insufficientFiatAmount);
            });
        }
    });
});
