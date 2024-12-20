import { Locator, Page, expect } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { WalletActions } from './walletActions';

export class MarketActions {
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

    openCoinMarket = async () => {
        const walletPage = new WalletActions(this.page);
        await walletPage.accountMenuButton.click();
        //TODO: #16073 We cannot set resolution for Electron. on CI button is hidden under dropdown due to a breakpoint
        const isBuyButtonHidden = !(await walletPage.coinMarketBuyButton.isVisible());
        if (isBuyButtonHidden) {
            await walletPage.walletExtraDropDown.click();
            await walletPage.coinMarketDropdownBuyButton.click();
        } else {
            await walletPage.coinMarketBuyButton.click();
        }
    };

    waitForOffersSyncToFinish = async () => {
        await expect(this.offerSpinner).toBeHidden({ timeout: 30000 });
    };

    setYouPayAmount = async (amount: string) => {
        //Warning: the field is initialized empty and gets default value after the first offer sync
        await expect(this.youPayInput).not.toHaveValue('');
        await this.waitForOffersSyncToFinish();
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
