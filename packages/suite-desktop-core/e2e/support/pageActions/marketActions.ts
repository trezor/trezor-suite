import { Locator, Page, expect } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import regional from '@trezor/suite/src/constants/wallet/coinmarket/regional';

const getCountryLabel = (country: string) => {
    const labelWithFlag = regional.countriesMap.get(country);
    if (!labelWithFlag) {
        throw new Error(`Country ${country} not found in the countries map`);
    }

    return labelWithFlag.substring(labelWithFlag.indexOf(' ') + 1);
};

export class MarketActions {
    readonly offerSpinner: Locator;
    readonly layout: Locator;
    readonly form: Locator;
    readonly bestOfferProvider: Locator;
    readonly bestOfferYouGet: Locator;
    readonly bestOfferAmount: Locator;
    readonly buyBestOfferButton: Locator;
    readonly youPayInput: Locator;
    readonly youPayCurrencyDropdown: Locator;
    readonly youPayCurrencyOption = (currency: FiatCurrencyCode) =>
        this.page.getByTestId(`@coinmarket/form/fiat-currency-select/option/${currency}`);
    readonly countryOfResidenceDropdown: Locator;
    readonly countryOfResidenceOption = (countryCode: string) =>
        this.page.getByTestId(`@coinmarket/form/country-select/option/${countryCode}`);
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
    readonly exchangeFeeDetails: Locator;

    constructor(private page: Page) {
        this.offerSpinner = this.page.getByTestId('@coinmarket/offers/loading-spinner');
        this.layout = this.page.getByTestId('@coinmarket');
        this.form = this.page.getByTestId('@coinmarket/form');
        this.bestOfferProvider = this.page.getByTestId('@coinmarket/offers/quote/provider');
        this.bestOfferYouGet = this.page.getByTestId('@coinmarket/best-offer/amount');
        this.bestOfferAmount = this.page.getByTestId('@coinmarket/form/offer/crypto-amount');
        this.buyBestOfferButton = this.page.getByTestId('@coinmarket/form/buy-button');
        this.youPayInput = this.page.getByTestId('@coinmarket/form/fiat-input');
        this.youPayCurrencyDropdown = this.page.getByTestId(
            '@coinmarket/form/fiat-currency-select/input',
        );
        this.countryOfResidenceDropdown = this.page.getByTestId(
            '@coinmarket/form/country-select/input',
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
        this.exchangeFeeDetails = this.page.getByTestId('@wallet/fee-details');
    }

    waitForOffersSyncToFinish = async () => {
        await expect(this.offerSpinner).toBeHidden({ timeout: 30000 });
        //Even though the offer sync is finished, the best offer might not be displayed correctly yet and show 0 BTC
        await expect(this.bestOfferAmount).not.toHaveText('0 BTC');
        await expect(this.buyBestOfferButton).toBeEnabled();
    };

    selectCountryOfResidence = async (countryCode: string) => {
        const countryLabel = getCountryLabel(countryCode);
        const currentCountry = await this.countryOfResidenceDropdown.textContent();
        if (currentCountry === countryLabel) {
            return;
        }
        await this.countryOfResidenceDropdown.click();
        await this.countryOfResidenceDropdown.getByRole('combobox').fill(countryLabel);
        await this.countryOfResidenceOption(countryCode).click();
    };

    selectFiatCurrency = async (currencyCode: FiatCurrencyCode) => {
        const currentCurrency = await this.youPayCurrencyDropdown.textContent();
        if (currentCurrency === currencyCode.toUpperCase()) {
            return;
        }
        await this.youPayCurrencyDropdown.click();
        await this.youPayCurrencyOption(currencyCode).click();
    };

    setYouPayAmount = async (
        amount: string,
        currency: FiatCurrencyCode = 'czk',
        country: string = 'CZ',
    ) => {
        //Warning: the field is initialized empty and gets default value after the first offer sync
        await expect(this.youPayInput).not.toHaveValue('');
        await this.selectCountryOfResidence(country);
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
        await expect(this.bestOfferAmount).not.toHaveText('0 BTC');
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
