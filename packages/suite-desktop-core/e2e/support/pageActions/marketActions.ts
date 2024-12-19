import { Locator, Page, expect } from '@playwright/test';

import { capitalizeFirstLetter } from '@trezor/utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { invityFixtures } from '../../fixtures/invity';

export class MarketActions {
    readonly accountMenuButton: Locator;
    readonly coinMarketBuyButton: Locator;
    readonly offerSpinner: Locator;
    readonly layout: Locator;
    readonly form: Locator;
    readonly bestOfferProvider: Locator;
    readonly bestOfferAmount: Locator;
    readonly buyBestOfferButton: Locator;
    readonly youPayInput: Locator;
    readonly buyOffersPage: Locator;
    readonly compareButton: Locator;
    readonly quotes: Locator;
    readonly quoteProvider: Locator;
    readonly quoteAmount: Locator;
    readonly selectThisQuoteButton: Locator;
    readonly modal: Locator;
    readonly buyTermsConfirmButton: Locator;
    readonly confirmOnTrezorButton: Locator;
    readonly confirmOnDevicePrompt: Locator;
    readonly tradeConfirmation: Locator;
    readonly tradeConfirmationCryptoAmount: Locator;
    readonly tradeConfirmationProvider: Locator;

    constructor(private page: Page) {
        this.accountMenuButton = this.page.getByTestId('@account-menu/btc/normal/0');
        this.coinMarketBuyButton = this.page.getByTestId('@wallet/menu/wallet-coinmarket-buy');
        this.offerSpinner = this.page.getByTestId('@coinmarket/offers/loading-spinner');
        this.layout = this.page.getByTestId('@coinmarket');
        this.form = this.page.getByTestId('@coinmarket/form');
        this.bestOfferProvider = this.page.getByTestId('@coinmarket/offers/quote/provider');
        this.bestOfferAmount = this.page.getByTestId('@coinmarket/form/offer/crypto-amount');
        this.buyBestOfferButton = this.page.getByTestId('@coinmarket/form/buy-button');
        this.youPayInput = this.page.getByTestId('@coinmarket/form/fiat-input');
        this.buyOffersPage = this.page.getByTestId('@coinmarket/buy-offers');
        this.compareButton = this.page.getByTestId('@coinmarket/form/compare-button');
        this.quotes = this.page.getByTestId('@coinmarket/offers/quote');
        this.quoteProvider = this.page.getByTestId('@coinmarket/offers/quote/provider');
        this.quoteAmount = this.page.getByTestId('@coinmarket/offers/quote/crypto-amount');
        this.selectThisQuoteButton = this.page.getByTestId(
            '@coinmarket/offers/get-this-deal-button',
        );
        this.modal = this.page.getByTestId('@modal');
        this.buyTermsConfirmButton = this.page.getByTestId(
            '@coinmarket/buy/offers/buy-terms-confirm-button',
        );
        this.confirmOnTrezorButton = this.page.getByTestId(
            '@coinmarket/offer/confirm-on-trezor-button',
        );
        this.confirmOnDevicePrompt = this.page.getByTestId('@prompts/confirm-on-device');
        this.tradeConfirmation = this.page.getByTestId('@coinmarket/form/info');
        this.tradeConfirmationCryptoAmount = this.page.getByTestId(
            '@coinmarket/form/info/crypto-amount',
        );
        this.tradeConfirmationProvider = this.page.getByTestId('@coinmarket/form/info/provider');
    }

    openCoinMarket = async () => {
        await this.accountMenuButton.click();
        await this.coinMarketBuyButton.click();
    };

    waitForOffers = async () => {
        await expect(this.offerSpinner).toBeVisible();
        await expect(this.offerSpinner).toBeHidden({ timeout: 30000 });
    };

    setYouPayAmount = async (amount: string) => {
        await this.youPayInput.fill(amount);
        await this.waitForOffers();
    };

    interceptInvity = async () => {
        const invityApiUrlToIntercept = 'https://exchange.trezor.io';
        for (const [path, fixture] of Object.entries(invityFixtures)) {
            await this.page.route(`${invityApiUrlToIntercept}${path}`, route => {
                route.fulfill({
                    status: 200,
                    body: JSON.stringify(fixture),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            });
        }
    };

    findQuoteRow = async (provider: string) => {
        //TODO #16041 Refactor to testid with provider name
        await expect(this.buyOffersPage).toBeVisible();
        const availableQuotes = await this.quotes.all();
        for (const quote of availableQuotes) {
            const quoteProvider = await quote.locator(this.quoteProvider).textContent();
            if (quoteProvider === capitalizeFirstLetter(provider)) {
                return quote;
            }
        }
        throw new Error(`Offer with provider ${provider} not found`);
    };

    selectQuote = async (provider: string) => {
        const quote = await this.findQuoteRow(provider);
        await quote.locator(this.selectThisQuoteButton).click();
    };

    confirmTrade = async () => {
        await expect(this.modal).toBeVisible();
        await this.buyTermsConfirmButton.click();
        await this.confirmOnTrezorButton.click();
        await expect(this.confirmOnDevicePrompt).toBeVisible();
        await TrezorUserEnvLink.pressYes();
        await expect(this.confirmOnDevicePrompt).not.toBeVisible();
    };
}
