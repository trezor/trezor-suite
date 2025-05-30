import { Locator, Page } from '@playwright/test';

import { FiatCurrencyCode } from '@suite-common/suite-config';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { Fees } from './fees';
import { getCompanyNameFromList, invityEndpoint } from '../../../fixtures/invity';
import {
    TrezorUserEnvLinkProxy,
    calculatePercentageOfBalance,
    formatAddress,
    getCountryLabel,
    paymentMethodToCamelCase,
    step,
} from '../../common';
import { expect } from '../../testExtends/customMatchers';
import { PaymentMethods, PercentageOfBalanceParams } from '../../types';
import { DevicePrompt } from '../devicePrompt';

const quoteProviderLocator = '@trading/offers/quote/provider';

const accountTabFilters = [
    'all-networks',
    'eth',
    'pol',
    'bsc',
    'arb',
    'base',
    'op',
    'sol',
] as const;

type AccountTabFilter = (typeof accountTabFilters)[number];

function isAccountTabFilter(network: string): network is AccountTabFilter {
    return accountTabFilters.includes(network as AccountTabFilter);
}

export class TradingPage {
    readonly fees: Fees;

    // Input and general
    readonly offerSpinner: Locator;
    readonly section: Locator;
    readonly form: Locator;
    readonly sellTabButton: Locator;
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
    readonly cryptoInputBottomText: Locator;
    readonly youPayFractionButton = (amount: '10%' | '25%' | '50%' | 'Max') =>
        this.page.getByRole('button', { name: amount });

    readonly countryOfResidenceDropdown: Locator;
    readonly countryOfResidenceOption = (countryCode: string) =>
        this.page.getByTestId(`@trading/form/country-select/option/${countryCode}`);
    readonly accountDropdown: Locator;
    readonly accountSearchInput: Locator;
    readonly accountTabFilter = (tab: AccountTabFilter) =>
        this.page.getByTestId(`@trading/form/select-crypto/network-tab/${tab}`);
    readonly accountOption = (cryptoName: string, symbol?: NetworkSymbol) => {
        const suffix = symbol ? `${cryptoName}-${symbol}` : cryptoName;

        return this.page.getByTestId(`@trading/form/select-crypto/option/${suffix}`);
    };
    readonly paymentMethodDropdown: Locator;
    readonly paymentMethodOption = (method: PaymentMethods) =>
        this.page.getByTestId(`@trading/form/payment-method-select/option/${method}`);
    readonly buyOffersPage: Locator;
    readonly compareButton: Locator;
    readonly quotes: Locator;
    readonly quoteOfProvider = (provider: string) =>
        this.page.getByTestId(`@trading/offers/quote-${provider}`);
    readonly refreshTime: Locator;
    readonly selectThisQuoteButton: Locator;
    readonly backToAccountButton: Locator;
    // Confirmation modal
    readonly modal: Locator;
    readonly termsConfirmButton: Locator;
    readonly confirmOnTrezorButton: Locator;
    readonly confirmationSection: Locator;
    readonly confirmationAccount: Locator;
    readonly confirmationAccountDropdown: Locator;
    readonly confirmationCryptoAmount: Locator;
    readonly confirmationFiatAmount: Locator;
    readonly confirmationProvider: Locator;
    readonly confirmationAddress: Locator;
    readonly confirmationPaymentMethod: Locator;
    readonly confirmationPaymentId: Locator;
    readonly confirmationExchangeType: Locator;
    readonly confirmationTransactionId: Locator;
    readonly copyTransactionIdButton: Locator;
    readonly finishTransactionButton: Locator;
    readonly confirmOnTrezorAndSend: Locator;
    // Swap
    readonly broadcastButton: Locator;
    readonly sendAddressInput: Locator;
    readonly sendAmountInput: Locator;
    readonly sendButton: Locator;
    readonly swapBestOfferButton: Locator;
    readonly swapAmountInputCurrencyTicker: Locator;
    readonly swapFromAccountInput: Locator;
    readonly swapFromAccountOption = (cryptoName: string, symbol?: NetworkSymbol) =>
        this.page.getByTestId(
            `@trading/form/trade-from/select-crypto/option/${cryptoName}${symbol ? `-${symbol}` : ''}`,
        );
    readonly swapTransactionFromAccount: Locator;
    readonly swapTransactionToAddress: Locator;
    // Transactions
    readonly transactionDetailStatus: Locator;
    readonly proceedToPayButton: Locator;
    // Sell
    readonly sellBestOfferButton: Locator;

    constructor(
        private page: Page,
        private readonly devicePrompt: DevicePrompt,
    ) {
        this.fees = new Fees(page);

        this.offerSpinner = this.page.getByTestId('@trading/offers/loading-spinner');
        this.section = this.page.getByTestId('@trading');
        this.form = this.page.getByTestId('@trading/form');
        this.sellTabButton = this.page.getByTestId('@trading/menu/wallet-trading-sell');
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
        this.cryptoInputBottomText = this.page.getByTestId(
            '@trading/form/crypto-input/bottom-text',
        );
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
        this.refreshTime = this.page.getByTestId('@trading/refresh-time-text');
        this.selectThisQuoteButton = this.page.getByTestId('@trading/offers/get-this-deal-button');
        this.backToAccountButton = this.page.getByRole('button', { name: 'Back to Account' });
        // Confirmation modal
        this.modal = this.page.getByTestId('@modal');
        this.termsConfirmButton = this.page.getByTestId(
            '@trading/offers/trade-terms-confirm-button',
        );
        this.confirmOnTrezorButton = this.page.getByTestId(
            '@trading/offer/confirm-on-trezor-button',
        );
        this.confirmationSection = this.page.getByTestId('@trading/selected-offer');
        this.confirmationAccount = this.page.getByTestId('@trading/form/verify/account');
        this.confirmationAccountDropdown = this.page.getByTestId(
            '@trading/verify-options/account/input',
        );
        this.confirmationCryptoAmount = this.page.getByTestId('@trading/form/info/crypto-amount');
        this.confirmationFiatAmount = this.page.getByTestId('@trading/form/info/fiat-amount');
        this.confirmationProvider = this.page.getByTestId('@trading/form/info/provider');
        this.confirmationAddress = this.page.getByTestId('@trading/form/verify/address');
        this.confirmationPaymentMethod = this.page.getByTestId('@trading/form/info/payment-method');
        this.confirmationPaymentId = this.page.getByTestId('@trading/form/verify/extra-id');
        this.confirmationExchangeType = this.page.getByTestId('@trading/offer/info/exchange-type');
        this.confirmationTransactionId = this.page.getByTestId('@trading/transaction-id');
        this.copyTransactionIdButton = this.page
            .getByTestId('@trading/form/info')
            .getByRole('button', { name: 'Copy' });
        this.finishTransactionButton = this.page.getByTestId(
            '@trading/offer/continue-transaction-button',
        );
        this.confirmOnTrezorAndSend = this.page.getByTestId(
            '@trading/offer/confirm-on-trezor-and-send',
        );
        // Swap
        this.broadcastButton = this.page.getByTestId('broadcast-button');
        this.sendAddressInput = this.page.getByTestId('outputs.0.address');
        this.sendAmountInput = this.page.getByTestId('outputs.0.amount');
        this.sendButton = this.page.getByTestId('@send/review-button');
        this.swapBestOfferButton = this.page.getByTestId('@trading/form/exchange-button');
        this.swapAmountInputCurrencyTicker = this.page.getByTestId(
            '@trading/form/crypto-input/input-addon',
        );
        this.swapFromAccountInput = this.page.getByTestId(
            '@trading/form/trade-from/select-crypto/input',
        );
        this.swapTransactionFromAccount = page.getByTestId('@trading/exchange-send/from-account');
        this.swapTransactionToAddress = page.getByTestId('@trading/exchange-send/to-address');
        // Transactions
        this.transactionDetailStatus = this.page.getByTestId('@trading/transaction/detail/status');
        this.proceedToPayButton = this.page.getByRole('button', { name: 'Proceed to pay' });
        // Sell
        this.sellBestOfferButton = this.page.getByTestId('@trading/form/sell-button');
    }

    @step()
    async waitForOffersSync() {
        await expect(this.offerSpinner).toBeHidden({ timeout: 30000 });
        //Even though the offer sync is finished, the best offer might not be displayed correctly yet and show 0 BTC
        await expect(this.bestOfferAmount).not.toHaveText(/^0( w+)?$/);
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
        if (isAccountTabFilter(symbol)) {
            await this.accountTabFilter(symbol).click();
        }
        await this.accountSearchInput.fill(cryptoName);
        await this.accountOption(cryptoName, symbol).click();
    }

    @step()
    async selectPaymentMethod(method: PaymentMethods) {
        await this.paymentMethodDropdown.click();
        await this.paymentMethodOption(method).click();
    }

    @step()
    async fillBuyForm(
        amount: string,
        cryptoCurrency: string = 'bitcoin',
        wantCrypto: boolean = false,
        fiatCurrencyCode: FiatCurrencyCode = 'czk',
        country: string = 'CZ',
    ) {
        const inputField = wantCrypto ? this.youPayCryptoInput : this.youPayFiatInput;
        await expect(inputField).not.toHaveValue('');
        await this.selectCountryOfResidence(country);
        await this.selectFiatCurrency(fiatCurrencyCode);
        const quotesRequestPromise = this.page.waitForRequest(invityEndpoint.buyQuotes);
        const quotesResponsePromise = this.page.waitForResponse(invityEndpoint.buyQuotes);
        await inputField.fill(amount);
        await expect(quotesRequestPromise).toHavePayload({
            wantCrypto,
            fiatCurrency: fiatCurrencyCode.toUpperCase(),
            receiveCurrency: cryptoCurrency,
            country,
            fiatStringAmount: wantCrypto ? '2500' : amount,
            ...(wantCrypto && { cryptoStringAmount: amount }),
        });
        await quotesResponsePromise;
        await this.waitForOffersSync();
    }

    @step()
    async fillSellForm(
        amount: string,
        cryptoCurrency: string = 'bitcoin',
        fiatCurrencyCode: FiatCurrencyCode = 'eur',
        country: string = 'CZ',
    ) {
        await this.selectCountryOfResidence(country);
        const quoteRequestPromise = this.page.waitForRequest(invityEndpoint.sellQuotes);
        await this.youPayCryptoInput.fill(amount);
        await expect(
            this.page.getByText('Not enough funds'),
            'Insufficient funds in the account to run sell flow test. Please contact the "tech_qa" Slack group immediately.',
        ).not.toBeVisible();
        await expect(quoteRequestPromise).toHavePayload({
            amountInCrypto: true,
            cryptoCurrency,
            fiatCurrency: fiatCurrencyCode.toUpperCase(),
            country,
            cryptoStringAmount: amount,
            fiatStringAmount: '',
            flows: ['BANK_ACCOUNT', 'PAYMENT_GATE'],
        });
        await this.waitForOffersSync();
    }

    @step()
    async fillSwapForm(params: {
        amount: string;
        sendCurrency: string;
        sendTicker: string;
        receiveCurrency: string;
        receiveSymbol: NetworkSymbol;
        receiveNetwork: string;
    }) {
        await this.page.selectDropdownOptionWithRetry(
            this.swapFromAccountInput,
            this.swapFromAccountOption(params.sendCurrency),
        );
        await this.selectAccount(params.receiveCurrency, params.receiveSymbol);
        // We should not fill in amount until account change takes effect = correct ticker is displayed
        await expect(this.swapAmountInputCurrencyTicker).toHaveText(params.sendTicker);

        const quotesRequestPromise = this.page.waitForRequest(invityEndpoint.swapQuotes);
        const quotesResponsePromise = this.page.waitForResponse(invityEndpoint.swapQuotes);
        await expect(this.bestOfferAmount).toHaveText(/0 \w+/);
        await this.youPayCryptoInput.fill(params.amount);
        await expect(quotesRequestPromise).toHavePayload({
            receive: params.receiveNetwork,
            send: params.sendCurrency,
            sendStringAmount: params.amount,
            dex: 'enable',
        });
        await quotesResponsePromise;
        await this.waitForOffersSync();
    }

    @step()
    async clickSwapBestOfferAndWaitForFees() {
        // The suite does not wait for these responses and it causes flakiness in automation.
        // Toast error: 'Transaction signing error: Missing composed data' and not possible to send.
        // So we have to wait for them manually.
        const swapFeeCallsPromise = this.fees.promiseForResponseSolanaFeeCalls();
        await this.swapBestOfferButton.click();
        await swapFeeCallsPromise;
    }

    @step()
    async confirmTrade(accountName: string, addressToCheck?: string) {
        await this.termsConfirmButton.click();
        await this.confirmOnTrezorButton.click();
        await expect(this.devicePrompt.headerParagraph).toHaveText(accountName);
        await this.devicePrompt.confirmOnDevicePromptIsShown();
        if (addressToCheck) {
            await expect(this.devicePrompt.outputValueOf('address')).toHaveText(
                formatAddress(addressToCheck),
            );
            await expect(this.devicePrompt).toDisplayReceiveAddress(addressToCheck);
        }
        await TrezorUserEnvLinkProxy.pressYes();
        await this.devicePrompt.confirmOnDevicePromptIsHidden();
        await expect(this.confirmOnTrezorButton).toHaveText('Confirmed on Trezor');
    }

    @step()
    async initiateSendConfirmation(options?: { confirmAlsoToken: boolean }) {
        await this.openConfirmAndSendModal();
        await this.devicePrompt.waitForPromptAndConfirm();
        if (options?.confirmAlsoToken) {
            await this.devicePrompt.waitForPromptAndConfirm();
        }
        await this.devicePrompt.waitForFinalPromptAndConfirm();
        // Note: We intentionally skip clicking the sell button in tests to prevent actual cryptocurrency transactions.
        // In a real scenario, the user would complete the transaction by clicking this button.
        await expect(this.devicePrompt.sendButton).toBeEnabled();
    }

    @step()
    async openConfirmAndSendModal() {
        await this.confirmOnTrezorAndSend.click();
        await expect(this.modal).toBeVisible();
        await expect(this.devicePrompt.sendButton).toBeDisabled();
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
    private async validateQuotes(
        quotesResponse: any[],
        listType: 'buyList' | 'sellList',
        formatExpectedAmount: (quote: any) => string,
    ) {
        const paymentMethod = await this.getSelectedPaymentMethod();
        const expectedQuotes = quotesResponse.filter(
            quote => quote.paymentMethod === paymentMethod && quote.error === undefined,
        );
        expect.soft(await this.quotes.count()).toBe(expectedQuotes.length);

        const displayedQuotes = await this.quotes.all();
        for (const [index, quote] of displayedQuotes.entries()) {
            //validate provider of the quote row
            const provider = await quote.getByTestId(quoteProviderLocator).textContent();
            const expectedProvider = getCompanyNameFromList(
                expectedQuotes[index].exchange,
                listType,
            );
            expect.soft(provider).toBe(expectedProvider);
            //validate amount of the quote row
            const amount = await quote.getByTestId('@trading/offers/quote/amount').textContent();
            const expectedAmount = formatExpectedAmount(expectedQuotes[index]);
            expect.soft(amount).toBe(expectedAmount);
        }
    }

    @step()
    async validateBuyQuotes(quotesResponse: any[]) {
        await this.validateQuotes(
            quotesResponse,
            'buyList',
            quote => `${quote.receiveStringAmount} BTC`,
        );
    }

    @step()
    async validateSellQuotes(quotesResponse: any[]) {
        await this.validateQuotes(
            quotesResponse,
            'sellList',
            quote => `€${parseFloat(quote.fiatStringAmount).toFixed(2)}`,
        );
    }

    @step()
    async waitForRedirectCompletion() {
        await expect(this.page.getByText('Buy & sell')).not.toBeVisible();
        await expect(this.page.getByText('Buy & sell')).toBeVisible({ timeout: 30_000 });
    }

    @step()
    async verifyBuyFormOpened(cryptoName: string) {
        await expect(this.accountDropdown).toContainText(cryptoName);
        await expect(this.page.getByText('You buy')).toBeVisible();
    }

    @step()
    async verifySellFormOpened(cryptoName: string) {
        await expect(this.accountDropdown).toContainText(cryptoName);
        await expect(this.page.getByText('You sell')).toBeVisible();
    }

    @step()
    async verifySwapFormOpened(cryptoName: string) {
        await expect(this.swapFromAccountInput).toContainText(cryptoName);
        await expect(this.page.getByText('Swap amount')).toBeVisible();
    }

    @step()
    async expectInputToBe(params: PercentageOfBalanceParams) {
        const expectedValue = calculatePercentageOfBalance(params);
        await expect.soft(this.youPayCryptoInput).toHaveValue(expectedValue);
    }
}
