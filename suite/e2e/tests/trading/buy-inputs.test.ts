import { getCryptoId } from '@suite-common/trading';
import { localizeNumber } from '@suite-common/wallet-utils';
import { capitalizeFirstLetter } from '@trezor/utils';

import {
    buyQuotesBTC,
    buyQuotesEthereum,
    buyQuotesNegativeMax,
    buyQuotesNegativeMin,
    buyTradeBTC,
    buyTradeEthereum,
    getCompanyNameFromList,
    invityEndpoint,
} from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

const fiatAmount = buyQuotesBTC[0].fiatStringAmount;
const bestBuyProvider = capitalizeFirstLetter(buyQuotesBTC[0].exchange);
const bestBuyCryptoAmount = `${buyQuotesBTC[0].receiveStringAmount} BTC`;

// Receive addresses from trade fixtures (derived from the test wallet seed)
const btcReceiveAddress = buyTradeBTC.trade.receiveAddress;
const ethReceiveAddress = buyTradeEthereum.trade.receiveAddress;
const ethBestProvider = capitalizeFirstLetter(buyQuotesEthereum[3].exchange);
const ethAmount = buyQuotesEthereum[3].fiatStringAmount;
const ethBestOffer = `${localizeNumber(buyQuotesEthereum[3].receiveStringAmount)} ETH`;

// Derive validation limits from mock data so tests stay in sync with fixtures
const { maxFiat } = buyQuotesNegativeMax[0];
const maxFiatCurrency = buyQuotesNegativeMax[0].fiatCurrency;
const { minFiat } = buyQuotesNegativeMin[0];
const minFiatCurrency = buyQuotesNegativeMin[0].fiatCurrency;

test.describe('Trading - Buy form inputs', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ page, onboardingPage, walletPage }) => {
        await page.route(invityEndpoint.buyQuotes, async route => {
            await route.fulfill({ json: buyQuotesBTC });
        });
        await onboardingPage.completeOnboarding();
        await walletPage.openTrading();
    });

    test('Fiat and crypto input mode toggle', async ({ tradingPage }) => {
        await test.step('Fill fiat amount and verify best offer', async () => {
            await tradingPage.fillBuyForm({
                amount: fiatAmount,
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, 'btc');
                },
            });
            await expect(tradingPage.quotes.bestOfferAmount).toHaveText(bestBuyCryptoAmount);
            await expect(tradingPage.quotes.provider).toHaveText(bestBuyProvider);
            await expect(tradingPage.receiveAccount.selectedReceiveAccount).toBeVisible();
            await expect(tradingPage.receiveAccount.receiveAddress).toHaveAttribute(
                'id',
                btcReceiveAddress,
            );
        });

        await test.step('Switch to crypto input mode', async () => {
            await tradingPage.inputs.fiatCryptoSwitchButton.click();
            await expect(tradingPage.inputs.cryptoAmount).toBeVisible();
        });

        await test.step('Switch back to fiat input mode', async () => {
            await tradingPage.inputs.fiatCryptoSwitchButton.click();
            await expect(tradingPage.inputs.fiatAmount).toBeVisible();
        });
    });

    test('Currency selector', async ({ tradingPage }) => {
        await test.step('Wait for buy form to load', async () => {
            await expect(tradingPage.inputs.fiatAmount).toHaveValue('');
            await tradingPage.assetPicker.openBuyModal.click({ trial: true });
        });

        await test.step('Switch currency to EUR', async () => {
            await tradingPage.inputs.selectFiatCurrency('eur');
        });

        await test.step('Switch currency to USD', async () => {
            await tradingPage.inputs.selectFiatCurrency('usd');
        });

        await test.step('Switch back to CZK', async () => {
            await tradingPage.inputs.selectFiatCurrency('czk');
        });
    });

    test('Payment method selector and offer comparison', async ({ tradingPage }) => {
        await test.step('Fill amount and open offer comparison', async () => {
            await tradingPage.fillBuyForm({
                amount: fiatAmount,
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, 'btc');
                },
            });
            await expect(tradingPage.receiveAccount.selectedReceiveAccount).toBeVisible();
            await expect(tradingPage.receiveAccount.receiveAddress).toHaveAttribute(
                'id',
                btcReceiveAddress,
            );
            await tradingPage.quotes.selectedProvider.click();
        });

        await test.step('Verify offers are displayed with refresh timer', async () => {
            await expect(tradingPage.quotes.refreshTime).toHaveText(
                /Offers refresh in(0:2[5-9]|0:30)/,
            );
            await tradingPage.quotes.validateBuyQuotes(
                buyQuotesBTC,
                tradingPage.inputs.getSelectedPaymentMethod,
            );
        });

        await test.step('Switch payment method to Bank Transfer', async () => {
            await tradingPage.inputs.selectPaymentMethod('bankTransfer');
            await tradingPage.quotes.validateBuyQuotes(
                buyQuotesBTC,
                tradingPage.inputs.getSelectedPaymentMethod,
            );
        });

        await test.step('Switch payment method to Google Pay', async () => {
            await tradingPage.inputs.selectPaymentMethod('googlePay');
            await tradingPage.quotes.validateBuyQuotes(
                buyQuotesBTC,
                tradingPage.inputs.getSelectedPaymentMethod,
            );
        });

        await test.step('Select a different offer and verify it is reflected in the form', async () => {
            const alternativeExchange = 'mercuryo';
            const alternativeProvider = getCompanyNameFromList(alternativeExchange, 'buyList');
            await tradingPage.quotes.list
                .filter({ hasText: alternativeProvider })
                .getByTestId('@trading/offers/get-this-deal-button')
                .click();
            await expect(tradingPage.quotes.provider).toHaveText(alternativeProvider);
        });
    });

    test('Amount validation and limits', async ({ page, tradingPage }) => {
        await test.step('Wait for buy form to load', async () => {
            await expect(tradingPage.inputs.fiatAmount).toHaveValue('');
            await tradingPage.assetPicker.openBuyModal.click({ trial: true });
            await tradingPage.inputs.selectFiatCurrency('czk');
        });

        await test.step('Zero amount shows validation error', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesNegativeMin });
            });
            await tradingPage.inputs.fiatAmount.fill('0');
            await expect(tradingPage.buyBestOfferButton).toBeDisabled();
        });

        await test.step('Amount above maximum shows max error', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesNegativeMax });
            });
            await tradingPage.inputs.fiatAmount.fill('1000000000');
            await expect(page.getByText(`Maximum is ${maxFiat} ${maxFiatCurrency}`)).toBeVisible();
            await expect(tradingPage.buyBestOfferButton).toBeDisabled();
        });

        await test.step('Amount below minimum shows min error', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesNegativeMin });
            });
            await tradingPage.inputs.fiatAmount.fill('0.01');
            await expect(page.getByText(`Minimum is ${minFiat} ${minFiatCurrency}`)).toBeVisible();
            await expect(tradingPage.buyBestOfferButton).toBeDisabled();
        });

        await test.step('Valid amount enables buy button', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesBTC });
            });
            await tradingPage.inputs.fiatAmount.fill(fiatAmount);
            await tradingPage.quotes.waitForSync();
            await expect(tradingPage.quotes.provider).toHaveText(bestBuyProvider);
            await expect(tradingPage.buyBestOfferButton).toBeEnabled();
        });

        await test.step('Switch to crypto input mode', async () => {
            await tradingPage.inputs.fiatCryptoSwitchButton.click();
            await expect(tradingPage.inputs.cryptoAmount).toBeVisible();
        });

        await test.step('Crypto amount above maximum shows max error', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesNegativeMax });
            });
            await tradingPage.inputs.cryptoAmount.fill('999');
            await expect(page.getByText(/Maximum is/)).toBeVisible();
            await expect(tradingPage.buyBestOfferButton).toBeDisabled();
        });

        await test.step('Crypto amount below minimum shows min error', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesNegativeMin });
            });
            await tradingPage.inputs.cryptoAmount.fill('0.000001');
            await expect(page.getByText(/Minimum is/)).toBeVisible();
            await expect(tradingPage.buyBestOfferButton).toBeDisabled();
        });
    });

    test('Crypto asset selector', async ({ tradingPage }) => {
        await test.step('Wait for buy form to load', async () => {
            await expect(tradingPage.inputs.fiatAmount).toHaveValue('');
        });

        await test.step('Open and close crypto asset picker', async () => {
            await tradingPage.assetPicker.openBuyModal.click();
            await expect(tradingPage.assetPicker.searchInput).toBeVisible();
            await tradingPage.assetPicker.searchInput.press('Escape');
        });

        await test.step('Open asset picker and verify search filters results', async () => {
            await tradingPage.assetPicker.openBuyModal.click();
            await tradingPage.assetPicker.searchAsset('Bitcoin');
            await expect(tradingPage.assetPicker.buyAssetOption(getCryptoId('btc'))).toBeVisible();
        });
    });

    test('Switch buy asset and fill different amounts', async ({ page, tradingPage }) => {
        await test.step('Fill BTC buy form with first amount', async () => {
            await tradingPage.fillBuyForm({
                amount: fiatAmount,
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, 'btc');
                },
            });
            await expect(tradingPage.quotes.bestOfferAmount).toHaveText(bestBuyCryptoAmount);
            await expect(tradingPage.quotes.provider).toHaveText(bestBuyProvider);
            await expect(tradingPage.receiveAccount.selectedReceiveAccount).toBeVisible();
            await expect(tradingPage.receiveAccount.receiveAddress).toHaveAttribute(
                'id',
                btcReceiveAddress,
            );
        });

        await test.step('Switch to Ethereum and fill different amount', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesEthereum });
            });
            await tradingPage.assetPicker.selectBuyAsset({
                searchFilter: 'Ethereum',
                networkFilter: 'eth',
                assetCryptoId: getCryptoId('eth'),
            });
            await tradingPage.fillBuyForm({
                amount: ethAmount,
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectAddSuiteReceiveAccount(0);
                },
            });
            await expect(tradingPage.quotes.bestOfferAmount).toContainText(ethBestOffer);
            await expect(tradingPage.quotes.provider).toHaveText(ethBestProvider);
            await expect(tradingPage.receiveAccount.selectedReceiveAccount).toBeVisible();
            await expect(tradingPage.receiveAccount.receiveAddress).toHaveAttribute(
                'id',
                ethReceiveAddress,
            );
        });

        await test.step('Switch back to Bitcoin and fill another amount', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesBTC });
            });
            await tradingPage.assetPicker.selectBuyAsset({
                searchFilter: 'Bitcoin',
                networkFilter: 'btc',
                assetCryptoId: getCryptoId('btc'),
            });
            await tradingPage.fillBuyForm({
                amount: fiatAmount,
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, 'btc');
                },
            });
            await expect(tradingPage.quotes.bestOfferAmount).toHaveText(bestBuyCryptoAmount);
            await expect(tradingPage.quotes.provider).toHaveText(bestBuyProvider);
            await expect(tradingPage.receiveAccount.selectedReceiveAccount).toBeVisible();
            await expect(tradingPage.receiveAccount.receiveAddress).toHaveAttribute(
                'id',
                btcReceiveAddress,
            );
        });
    });

    test('Buy form is prefilled with coin from the account it was entered from', async ({
        page,
        tradingPage,
        walletPage,
        settingsPage,
    }) => {
        await test.step('Enable Ethereum network', async () => {
            await settingsPage.changeNetworks({ enableNetworks: ['eth'] });
        });

        await test.step('Open buy from Ethereum account and verify ETH is prefilled', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesEthereum });
            });
            await walletPage.openAccount({ symbol: 'eth' });
            await tradingPage.buyButton.click();
            await tradingPage.verifyBuyFormOpened(/Ethereum/);
        });

        await test.step('Fill ETH buy form and verify provider and address', async () => {
            await tradingPage.fillBuyForm({
                amount: ethAmount,
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectSuiteReceiveAccount(0);
                },
            });
            await expect(tradingPage.quotes.bestOfferAmount).toContainText(ethBestOffer);
            await expect(tradingPage.quotes.provider).toHaveText(ethBestProvider);
            await expect(tradingPage.receiveAccount.selectedReceiveAccount).toBeVisible();
            await expect(tradingPage.receiveAccount.receiveAddress).toHaveAttribute(
                'id',
                ethReceiveAddress,
            );
        });
    });

    test('Empty quotes shows no offers', async ({ page, tradingPage }) => {
        await test.step('Wait for buy form to load', async () => {
            await expect(tradingPage.inputs.fiatAmount).toHaveValue('');
            await tradingPage.assetPicker.openBuyModal.click({ trial: true });
        });

        await test.step('Enter valid amount with empty quotes response', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: {} });
            });
            await expect(page.getByText('Receive account')).toBeVisible();
            await tradingPage.inputs.fiatAmount.fill('5000');
            await expect(page.getByTestId('trading-offer-found-none')).toBeVisible();
            await expect(tradingPage.buyBestOfferButton).toBeDisabled();
            await expect(tradingPage.quotes.selectedProvider).toBeHidden();
            await expect(tradingPage.quotes.selectButton).toBeHidden();
        });
    });

    test('Country selector', async ({ tradingPage }) => {
        await test.step('Wait for buy form to load', async () => {
            await expect(tradingPage.inputs.fiatAmount).toHaveValue('');
            await expect(tradingPage.inputs.countryValue).not.toHaveText('Worldwide');
        });

        await test.step('Change country of residence to DE', async () => {
            await tradingPage.inputs.selectCountryOfResidence('DE');
            await expect(tradingPage.inputs.countryValue).toContainText('DE');
        });

        await test.step('Change country of residence to USA', async () => {
            await tradingPage.inputs.selectCountryOfResidence('US');
            // await tradingPage.inputs.selectState('CA'); TODO
            await expect(tradingPage.inputs.countryValue).toContainText('US');
        });
    });
});
