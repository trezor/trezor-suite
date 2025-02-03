import { Locator, Page } from '@playwright/test';

import { FiatCurrencyCode } from '@suite-common/suite-config';
import { regional } from '@suite-common/trading';
import { NetworkSymbol } from '@suite-common/wallet-config';

import {
    buyQuotesBTC,
    createRedirectedTradeResponse,
    invityEndpoint,
    invityResponses,
} from '../../fixtures/invity';
import expectedTradeRequestPayload from '../../fixtures/invity/buy/trade-request.json';
import { TrezorUserEnvLinkProxy, step } from '../common';
import { expect } from '../customMatchers';
import { DevicePromptActions } from './devicePromptActions';
import { TradeRequest } from '../../fixtures/invity/types';

const quoteProviderLocator = '@trading/offers/quote/provider';
const quoteAmountLocator = '@trading/offers/quote/crypto-amount';
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
    devicePrompt: DevicePromptActions;

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
        this.page.getByTestId(`@trading/form/fiat-currency-select/option/${currency}`);
    readonly youPayFiatCryptoSwitchButton: Locator;
    readonly youPayCryptoInput: Locator;
    readonly youPayFractionButton = (amount: '10%' | '25%' | '50%' | 'Max') =>
        this.page.getByRole('button', { name: amount });
    readonly feeButton = (fee: 'economy' | 'normal' | 'high' | 'custom') =>
        this.page.getByTestId(`select-bar/${fee}`);
    readonly customFeeInput: Locator;
    readonly countryOfResidenceDropdown: Locator;
    readonly countryOfResidenceOption = (countryCode: string) =>
        this.page.getByTestId(`@trading/form/country-select/option/${countryCode}`);
    readonly accountDropdown: Locator;
    readonly accountSearchInput: Locator;
    readonly accountTabFilter = (tab: 'all-networks' | 'eth' | 'pol' | 'bsc' | 'sol') =>
        this.page.getByTestId(`@trading/form/select-crypto/network-tab/${tab}`);
    readonly accountOption = (cryptoName: string, symbol: NetworkSymbol) =>
        this.page.getByTestId(`@trading/form/select-crypto/option/${cryptoName}-${symbol}`);
    readonly paymentMethodDropdown: Locator;
    readonly paymentMethodOption = (method: PaymentMethods) =>
        this.page.getByTestId(`@trading/form/payment-method-select/option/${method}`);
    readonly buyOffersPage: Locator;
    readonly compareButton: Locator;
    readonly quotes: Locator;
    readonly quoteOfProvider = (provider: string) =>
        this.page.getByTestId(`@trading/offers/quote-${provider}`);
    readonly quoteAmount: Locator;
    readonly refreshTime: Locator;
    readonly selectThisQuoteButton: Locator;
    // Confirmation modal
    readonly modal: Locator;
    readonly buyTermsConfirmButton: Locator;
    readonly confirmOnTrezorButton: Locator;
    readonly confirmationSection: Locator;
    readonly confirmationAccountDropdown: Locator;
    readonly confirmationCryptoAmount: Locator;
    readonly confirmationFiatAmount: Locator;
    readonly confirmationProvider: Locator;
    readonly confirmationAddress: Locator;
    readonly confirmationPaymentMethod: Locator;
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
        this.devicePrompt = new DevicePromptActions(page);
        this.offerSpinner = this.page.getByTestId('@trading/offers/loading-spinner');
        this.section = this.page.getByTestId('@trading');
        this.form = this.page.getByTestId('@trading/form');
        this.quoteProvider = this.page.getByTestId(quoteProviderLocator);
        this.bestOfferSection = this.page.getByTestId('@trading/best-offer');
        this.bestOfferAmount = this.page.getByTestId('@trading/best-offer/amount');
        this.buyBestOfferButton = this.page.getByTestId('@trading/form/buy-button');
        this.youPayFiatInput = this.page.getByTestId('@trading/form/fiat-input');
        this.youPayCurrencyDropdown = this.page.getByTestId(
            '@trading/form/fiat-currency-select/input',
        );
        this.youPayFiatCryptoSwitchButton = this.page.getByTestId(
            '@trading/form/switch-crypto-fiat',
        );
        this.youPayCryptoInput = this.page.getByTestId('@trading/form/crypto-input');
        this.customFeeInput = this.page.getByTestId('feePerUnit');
        this.countryOfResidenceDropdown = this.page.getByTestId(
            '@trading/form/country-select/input',
        );
        this.accountDropdown = this.page.getByTestId('@trading/form/select-crypto/input');
        this.accountSearchInput = this.page.getByTestId('@trading/form/select-crypto/search-input');
        this.paymentMethodDropdown = this.page.getByTestId(
            '@trading/form/payment-method-select/input',
        );
        this.buyOffersPage = this.page.getByTestId('@trading/buy-offers');
        this.compareButton = this.page.getByTestId('@trading/form/compare-button');
        this.quotes = this.page.getByTestId('@trading/offers/quote');
        this.quoteAmount = this.page.getByTestId(quoteAmountLocator);
        this.refreshTime = this.page.getByTestId('@trading/refresh-time-text');
        this.selectThisQuoteButton = this.page.getByTestId('@trading/offers/get-this-deal-button');
        this.modal = this.page.getByTestId('@modal');
        this.buyTermsConfirmButton = this.page.getByTestId(
            '@trading/buy/offers/buy-terms-confirm-button',
        );
        this.confirmOnTrezorButton = this.page.getByTestId(
            '@trading/offer/confirm-on-trezor-button',
        );
        this.confirmationSection = this.page.getByTestId('@trading/selected-offer');
        this.confirmationAccountDropdown = this.page.getByTestId(
            '@trading/verify-options/account/input',
        );
        this.confirmationCryptoAmount = this.page.getByTestId('@trading/form/info/crypto-amount');
        this.confirmationFiatAmount = this.page.getByTestId('@trading/form/info/fiat-amount');
        this.confirmationProvider = this.page.getByTestId('@trading/form/info/provider');
        this.confirmationAddress = this.page.getByTestId('@trading/form/verify/address');
        this.confirmationPaymentMethod = this.page.getByTestId('@trading/form/info/payment-method');
        this.confirmTradeButton = this.page.getByTestId(
            '@trading/offer/continue-transaction-button',
        );
        this.exchangeFeeDetails = this.page.getByTestId('@wallet/fee-details');
        this.broadcastButton = this.page.getByTestId('broadcast-button');
        this.sendAddressInput = this.page.getByTestId('outputs.0.address');
        this.sendAmountInput = this.page.getByTestId('outputs.0.amount');
        this.sendButton = this.page.getByTestId('@send/review-button');
        this.transactionList = this.page.getByTestId('@trading/transactions/list');
        this.transactionInfo = this.page.getByTestId('@trading/transactions/info');
        this.transactionStatus = this.page.getByTestId('@trading/transactions/status');
        this.transactionDetailsButton = this.page.getByRole('button', { name: 'View Details' });
        this.transactionDetailStatus = this.page.getByTestId('@trading/transaction/detail/status');
        this.proceedToPayButton = this.page.getByRole('button', { name: 'Proceed to pay' });
        this.transactionDetail = this.page.getByTestId('@trading/transaction/detail');
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
    async setYouPayFiatAmount(
        amount: string,
        currency: FiatCurrencyCode = 'czk',
        country: string = 'CZ',
    ) {
        // Warning: the field is initialized empty and gets default value after the first offer sync
        await expect(this.youPayFiatInput).not.toHaveValue('');
        await this.selectCountryOfResidence(country);
        await this.selectFiatCurrency(currency);
        const quotesPromise = this.page.waitForResponse(invityEndpoint.buyQuotes);
        await this.youPayFiatInput.fill(amount);
        await quotesPromise;
        // Warning: Bug #16054, as a workaround we wait for offer sync after setting the amount
        await this.waitForOffersSyncToFinish();
    }

    @step()
    async setYouPayCryptoAmount(amount: string, country: string = 'CZ') {
        // Warning: the field is initialized empty and gets default value after the first offer sync
        await expect(this.youPayCryptoInput).not.toHaveValue('');
        await this.selectCountryOfResidence(country);
        await this.youPayCryptoInput.fill(amount);
        // Warning: Bug #16054, as a workaround we wait for offer sync after setting the amount
        await this.waitForOffersSyncToFinish();
    }

    @step()
    async confirmTrade(addressToCheck?: string) {
        await expect(this.modal).toBeVisible();
        await this.buyTermsConfirmButton.click();
        await this.confirmOnTrezorButton.click();
        if (addressToCheck) {
            await expect(this.devicePrompt.outputValueOf('address')).toHaveText(addressToCheck);
        }
        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await TrezorUserEnvLinkProxy.pressYes();
        await this.devicePrompt.confirmOnDevicePromptIsHidden();
    }

    @step()
    async finishMockedTrade() {
        const tradeRequestPromise = this.page.waitForRequest(invityEndpoint.buyTrade);
        await this.confirmTradeButton.click();
        await expect(tradeRequestPromise).toHavePayload(expectedTradeRequestPayload, {
            omit: ['returnUrl', 'trade.orderId', 'trade.paymentId'],
        });
    }

    // We bypass the provider part of the flow by having a modified redirect in trade response.
    // This redirect is provided by Invity and normaly leads to provider's page.
    // But our mocked response redirects us to transaction detail where our flow continues.
    @step()
    async mockInvityTrade(tradeRequest: TradeRequest, symbol: NetworkSymbol) {
        const redirectedTradeResponse = createRedirectedTradeResponse({
            symbol,
            tradeRequest,
            url: this.url,
        });
        await this.page.route(invityEndpoint.buyTrade, async route => {
            await route.fulfill({ json: redirectedTradeResponse });
        });
    }

    @step()
    async mockInvity() {
        for (const [url, response] of Object.entries(invityResponses)) {
            await this.page.route(url, async route => {
                await route.fulfill({ json: response });
            });
        }
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
        const expectedQuotes = buyQuotesBTC.filter(
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
