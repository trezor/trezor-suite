import { Locator, Page, expect } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { FiatCurrencyCode } from '@suite-common/suite-config';

export class MarketActions {
    readonly offerSpinner: Locator;
    readonly layout: Locator;
    readonly form: Locator;
    readonly bestOfferProvider: Locator;
    readonly bestOfferAmount: Locator;
    readonly buyBestOfferButton: Locator;
    readonly youPayInput: Locator;
    readonly youPayCurrencyDropdown: Locator;
    readonly youPayCurrencyOption = (currency: FiatCurrencyCode) =>
        this.page.getByTestId(`@coinmarket/form/fiat-currency-select/option/${currency}`);
    readonly buyOffersPage: Locator;
    readonly compareButton: Locator;
    readonly quotes: Locator;
    readonly quoteOfProvider = (provider: string) =>
        this.page.getByTestId(`@coinmarket/offers/quote-${provider}`);
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
    readonly tradeConfirmationContinueButton: Locator;

    constructor(private page: Page) {
        this.offerSpinner = this.page.getByTestId('@coinmarket/offers/loading-spinner');
        this.layout = this.page.getByTestId('@coinmarket');
        this.form = this.page.getByTestId('@coinmarket/form');
        this.bestOfferProvider = this.page.getByTestId('@coinmarket/offers/quote/provider');
        this.bestOfferAmount = this.page.getByTestId('@coinmarket/form/offer/crypto-amount');
        this.buyBestOfferButton = this.page.getByTestId('@coinmarket/form/buy-button');
        this.youPayInput = this.page.getByTestId('@coinmarket/form/fiat-input');
        this.youPayCurrencyDropdown = this.page.getByTestId(
            '@coinmarket/form/fiat-currency-select/input',
        );
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
        this.tradeConfirmation = this.page.getByTestId('@coinmarket/selected-offer');
        this.tradeConfirmationCryptoAmount = this.page.getByTestId(
            '@coinmarket/form/info/crypto-amount',
        );
        this.tradeConfirmationProvider = this.page.getByTestId('@coinmarket/form/info/provider');
        this.tradeConfirmationContinueButton = this.page.getByTestId(
            '@coinmarket/offer/continue-transaction-button',
        );
    }

    waitForOffersSyncToFinish = async () => {
        await expect(this.offerSpinner).toBeVisible();
        await expect(this.offerSpinner).toBeHidden({ timeout: 30000 });
    };

    selectFiatCurrency = async (currency: FiatCurrencyCode) => {
        const currentCurrency = await this.youPayCurrencyDropdown.textContent();
        if (currentCurrency === currency.toUpperCase()) {
            return;
        }
        await this.youPayCurrencyDropdown.click();
        await this.youPayCurrencyOption(currency).click();
    };

    setYouPayAmount = async (amount: string, currency: FiatCurrencyCode) => {
        //Warning: the field is initialized empty and gets default value after the first offer sync
        await expect(this.youPayInput).not.toHaveValue('');
        await expect(this.offerSpinner).toBeHidden({ timeout: 30000 });
        await this.selectFiatCurrency(currency);
        await this.youPayInput.fill(amount);
        //Warning: Bug #16054, as a workaround we wait for offer sync after setting the amount
        await this.waitForOffersSyncToFinish();
    };

    confirmTrade = async () => {
        await expect(this.modal).toBeVisible();
        await this.buyTermsConfirmButton.click();
        await this.confirmOnTrezorButton.click();
        await expect(this.confirmOnDevicePrompt).toBeVisible();
        await TrezorUserEnvLink.pressYes();
        await expect(this.confirmOnDevicePrompt).not.toBeVisible();
    };

    readBestOfferValues = async () => {
        const amount = await this.bestOfferAmount.textContent();
        const provider = await this.bestOfferProvider.textContent();
        if (!amount || !provider) {
            throw new Error(
                `Test was not able to extract amount or provider from the page. Amount: ${amount}, Provider: ${provider}`,
            );
        }

        return { amount, provider };
    };
}
