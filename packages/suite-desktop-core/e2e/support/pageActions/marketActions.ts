import { Locator, Page } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { regional } from '@suite-common/invity';

import { expect } from '../customMatchers';
import { step } from '../common';
import {
    createRedirectedTradeResponse,
    invityEndpoint,
    invityResponses,
    buyQuotes,
} from '../../fixtures/invity';
import expectedTradeRequestPayload from '../../fixtures/invity/buy/trade-request.json';

const quoteProviderLocator = '@coinmarket/offers/quote/provider';
const quoteAmountLocator = '@coinmarket/offers/quote/crypto-amount';
const getCountryLabel = (country: string) => {
    const labelWithFlag = regional.countriesMap.get(country);
    if (!labelWithFlag) {
        throw new Error(`Country ${country} not found in the countries map`);
    }

    return labelWithFlag.substring(labelWithFlag.indexOf(' ') + 1);
};

const paymentMethodToCamelCase = (text: string) =>
    text
        .split(' ')
        .map((word, index) => (index === 0 ? word.toLowerCase() : word))
        .join('') as PaymentMethods;

type PaymentMethods =
    | 'googlePay'
    | 'applePay'
    | 'creditCard'
    | 'paypal'
    | 'bankTransfer'
    | 'revolutPay';

export class MarketActions {
    // Input and general
    readonly offerSpinner: Locator;
    readonly section: Locator;
    readonly form: Locator;
    readonly quoteProvider: Locator;
    readonly bestOfferSection: Locator;
    readonly bestOfferAmount: Locator;
    readonly buyBestOfferButton: Locator;
    readonly youPayFiatInput: Locator;
    readonly youPayCurrencyDropdown: Locator;
    readonly youPayCurrencyOption = (currency: FiatCurrencyCode) =>
        this.page.getByTestId(`@coinmarket/form/fiat-currency-select/option/${currency}`);
    readonly youPayFiatCryptoSwitchButton: Locator;
    readonly youPayFractionButton = (amount: '10%' | '25%' | '50%' | 'Max') =>
        this.page.getByRole('button', { name: amount });
    readonly feeButton = (fee: 'economy' | 'normal' | 'high' | 'custom') =>
        this.page.getByTestId(`select-bar/${fee}`);
    readonly customFeeInput: Locator;
    readonly countryOfResidenceDropdown: Locator;
    readonly countryOfResidenceOption = (countryCode: string) =>
        this.page.getByTestId(`@coinmarket/form/country-select/option/${countryCode}`);
    readonly accountDropdown: Locator;
    readonly accountSearchInput: Locator;
    readonly accountTabFilter = (tab: 'all-networks' | 'eth' | 'pol' | 'bsc' | 'sol') =>
        this.page.getByTestId(`@coinmarket/form/select-crypto/network-tab/${tab}`);
    readonly accountOption = (cryptoName: string, symbol: NetworkSymbol) =>
        this.page.getByTestId(`@coinmarket/form/select-crypto/option/${cryptoName}-${symbol}`);
    readonly paymentMethodDropdown: Locator;
    readonly paymentMethodOption = (method: PaymentMethods) =>
        this.page.getByTestId(`@coinmarket/form/payment-method-select/option/${method}`);
    // Compared offers
    readonly buyOffersPage: Locator;
    readonly compareButton: Locator;
    readonly quotes: Locator;
    readonly quoteOfProvider = (provider: string) =>
        this.page.getByTestId(`@coinmarket/offers/quote-${provider}`);
    readonly quoteAmount: Locator;
    readonly refreshTime: Locator;
    readonly selectThisQuoteButton: Locator;
    // Confirmation modal
    readonly modal: Locator;
    readonly buyTermsConfirmButton: Locator;
    readonly confirmOnTrezorButton: Locator;
    readonly confirmOnDevicePrompt: Locator;
    readonly confirmationSection: Locator;
    readonly confirmationCryptoAmount: Locator;
    readonly confirmationProvider: Locator;
    readonly confirmTradeButton: Locator;
    // Exchange
    readonly exchangeFeeDetails: Locator;
    readonly broadcastButton: Locator;
    readonly sendAddressInput: Locator;
    readonly sendAmountInput: Locator;
    readonly sendButton: Locator;
    // Transactions
    readonly transactionList: Locator;
    readonly transactionInfo: Locator;
    readonly transactionStatus: Locator;
    readonly transactionDetailsButton: Locator;
    readonly transactionDetailStatus: Locator;
    readonly proceedToPayButton: Locator;
    readonly transactionDetail: Locator;
    readonly transactionWatchPeriod = '00:30';

    constructor(
        private page: Page,
        private url: string,
    ) {
        this.offerSpinner = this.page.getByTestId('@coinmarket/offers/loading-spinner');
        this.section = this.page.getByTestId('@coinmarket');
        this.form = this.page.getByTestId('@coinmarket/form');
        this.quoteProvider = this.page.getByTestId(quoteProviderLocator);
        this.bestOfferSection = this.page.getByTestId('@coinmarket/best-offer');
        this.bestOfferAmount = this.page.getByTestId('@coinmarket/best-offer/amount');
        this.buyBestOfferButton = this.page.getByTestId('@coinmarket/form/buy-button');
        this.youPayFiatInput = this.page.getByTestId('@coinmarket/form/fiat-input');
        this.youPayCurrencyDropdown = this.page.getByTestId(
            '@coinmarket/form/fiat-currency-select/input',
        );
        this.youPayFiatCryptoSwitchButton = this.page.getByTestId(
            '@coinmarket/form/switch-crypto-fiat',
        );
        this.customFeeInput = this.page.getByTestId('feePerUnit');
        this.countryOfResidenceDropdown = this.page.getByTestId(
            '@coinmarket/form/country-select/input',
        );
        this.accountDropdown = this.page.getByTestId('@coinmarket/form/select-crypto/input');
        this.accountSearchInput = this.page.getByTestId(
            '@coinmarket/form/select-crypto/search-input',
        );
        this.paymentMethodDropdown = this.page.getByTestId(
            '@coinmarket/form/payment-method-select/input',
        );
        this.buyOffersPage = this.page.getByTestId('@coinmarket/buy-offers');
        this.compareButton = this.page.getByTestId('@coinmarket/form/compare-button');
        this.quotes = this.page.getByTestId('@coinmarket/offers/quote');
        this.quoteAmount = this.page.getByTestId(quoteAmountLocator);
        this.refreshTime = this.page.getByTestId('@coinmarket/refresh-time');
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
        this.confirmationSection = this.page.getByTestId('@coinmarket/selected-offer');
        this.confirmationCryptoAmount = this.page.getByTestId(
            '@coinmarket/form/info/crypto-amount',
        );
        this.confirmationProvider = this.page.getByTestId('@coinmarket/form/info/provider');
        this.confirmTradeButton = this.page.getByTestId(
            '@coinmarket/offer/continue-transaction-button',
        );
        this.exchangeFeeDetails = this.page.getByTestId('@wallet/fee-details');
        this.broadcastButton = this.page.getByTestId('broadcast-button');
        this.sendAddressInput = this.page.getByTestId('outputs.0.address');
        this.sendAmountInput = this.page.getByTestId('outputs.0.amount');
        this.sendButton = this.page.getByTestId('@send/review-button');
        this.transactionList = this.page.getByTestId('@coinmarket/transactions/list');
        this.transactionInfo = this.page.getByTestId('@coinmarket/transactions/info');
        this.transactionStatus = this.page.getByTestId('@coinmarket/transactions/status');
        this.transactionDetailsButton = this.page.getByRole('button', { name: 'View Details' });
        this.transactionDetailStatus = this.page.getByTestId(
            '@coinmarket/transaction/detail/status',
        );
        this.proceedToPayButton = this.page.getByRole('button', { name: 'Proceed to pay' });
        this.transactionDetail = this.page.getByTestId('@coinmarket/transaction/detail');
    }

    @step()
    async waitForOffersSyncToFinish() {
        await expect(this.offerSpinner).toBeHidden({ timeout: 30000 });
        //Even though the offer sync is finished, the best offer might not be displayed correctly yet and show 0 BTC
        await expect(this.bestOfferAmount).not.toHaveText('0 BTC');
        await expect(this.buyBestOfferButton).toBeEnabled();
    }

    @step()
    async selectCountryOfResidence(countryCode: string) {
        const countryLabel = getCountryLabel(countryCode);
        const currentCountry = await this.countryOfResidenceDropdown.textContent();
        if (currentCountry === countryLabel) {
            return;
        }
        await this.countryOfResidenceDropdown.click();
        await this.countryOfResidenceDropdown.getByRole('combobox').fill(countryLabel);
        await this.countryOfResidenceOption(countryCode).click();
    }

    @step()
    async selectFiatCurrency(currencyCode: FiatCurrencyCode) {
        const currentCurrency = await this.youPayCurrencyDropdown.textContent();
        if (currentCurrency === currencyCode.toUpperCase()) {
            return;
        }
        await this.youPayCurrencyDropdown.click();
        await this.youPayCurrencyOption(currencyCode).click();
    }

    @step()
    async selectAccount(cryptoName: string, symbol: NetworkSymbol) {
        await this.accountDropdown.click();
        await this.accountSearchInput.fill(cryptoName);
        await this.accountOption(cryptoName, symbol).click();
    }

    @step()
    async selectPaymentMethod(method: PaymentMethods) {
        await this.paymentMethodDropdown.click();
        await this.paymentMethodOption(method).click();
    }

    @step()
    async setYouPayAmount(
        amount: string,
        currency: FiatCurrencyCode = 'czk',
        country: string = 'CZ',
    ) {
        // Warning: the field is initialized empty and gets default value after the first offer sync
        await expect(this.youPayFiatInput).not.toHaveValue('');
        await this.selectCountryOfResidence(country);
        await this.selectFiatCurrency(currency);
        await this.youPayFiatInput.fill(amount);
        // Warning: Bug #16054, as a workaround we wait for offer sync after setting the amount
        await this.waitForOffersSyncToFinish();
    }

    @step()
    async confirmTrade() {
        await expect(this.modal).toBeVisible();
        await this.buyTermsConfirmButton.click();
        await this.confirmOnTrezorButton.click();
        await expect(this.confirmOnDevicePrompt).toBeVisible();
        await TrezorUserEnvLink.pressYes();
        await expect(this.confirmOnDevicePrompt).not.toBeVisible();
    }

    @step()
    async finishMockedTrade() {
        const tradeRequestPromise = this.page.waitForRequest(invityEndpoint.buyTrade);
        await this.confirmTradeButton.click();
        await expect(tradeRequestPromise).toHavePayload(expectedTradeRequestPayload, {
            omit: ['returnUrl', 'trade.orderId', 'trade.paymentId'],
        });
    }

    @step()
    async mockInvity() {
        for (const [url, response] of Object.entries(invityResponses)) {
            await this.page.route(url, async route => {
                await route.fulfill({ json: response });
            });
        }

        const redirecteTradeResponse = createRedirectedTradeResponse(this.url);
        await this.page.route(invityEndpoint.buyTrade, async route => {
            await route.fulfill({ json: redirecteTradeResponse });
        });
    }

    @step()
    async changeTransactionWatchResponseTo(status: 'SUBMITTED' | 'SUCCESS') {
        await this.page.route(invityEndpoint.buyWatch, async route => {
            await route.fulfill({ json: { status } });
        });
    }

    @step()
    async getSelectedPaymentMethod() {
        const dropdownText = await this.paymentMethodDropdown.textContent();
        if (!dropdownText || typeof dropdownText !== 'string') {
            throw new Error('Payment method dropdown is empty or not a string');
        }

        return paymentMethodToCamelCase(dropdownText);
    }

    @step()
    async validateBuyQuotes() {
        const paymentMethod = await this.getSelectedPaymentMethod();
        const expectedQuotes = buyQuotes.filter(
            quote => quote.paymentMethod === paymentMethod && quote.error === undefined,
        );
        expect.soft(await this.quotes.count()).toBe(expectedQuotes.length);

        const displayedQuotes = await this.quotes.all();
        for (const [index, quote] of displayedQuotes.entries()) {
            const provider = await quote.getByTestId(quoteProviderLocator).textContent();
            const amount = await quote.getByTestId(quoteAmountLocator).textContent();
            expect.soft(provider?.toLowerCase()).toBe(expectedQuotes[index].exchange);
            expect.soft(amount).toBe(expectedQuotes[index].receiveStringAmount);
        }
    }
}
