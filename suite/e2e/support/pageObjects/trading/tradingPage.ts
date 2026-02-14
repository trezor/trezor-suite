import { Locator, Page } from '@playwright/test';
import { CryptoId } from 'invity-api';

import { messages } from '@suite/intl';
import { TradingCountryCode } from '@suite-common/trading';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { Assets } from '../assets';
import { FeeSection } from './feeSection';
import { getCompanyNameFromList, invityEndpoint } from '../../../fixtures/invity';
import { calculatePercentageOfBalance, getCountryLabel, step } from '../../common';
import { expect } from '../../testExtends/customMatchers';
import { PaymentMethods, PercentageOfBalanceParams } from '../../types';
import { DevicePrompt } from '../devicePrompt';
import { ReceiveAccount } from './receiveAccount';

const quoteProviderLocator = '@trading/offers/quote/provider';

const paymentMethodNameMap: Record<string, PaymentMethods> = {
    'Credit/Debit Card': 'creditCard',
    'Bank Transfer': 'bankTransfer',
    'Google Pay': 'googlePay',
    'Apple Pay': 'applePay',
    Paypal: 'paypal',
    'Revolut Pay': 'revolutPay',
};

export class TradingPage {
    readonly fees: FeeSection;
    readonly assets: Assets;
    readonly receiveAccount: ReceiveAccount;

    // Input and general
    readonly offerSpinner: Locator;
    readonly section: Locator;
    readonly buyButton: Locator;
    readonly sellTabButton: Locator;
    readonly quoteProvider: Locator;
    readonly bestOfferAmount: Locator;
    readonly buyBestOfferButton: Locator;
    readonly youPayFiatInput: Locator;
    readonly youPayCurrencyDropdown: Locator;
    readonly youPayCurrencyOption = (currency: BaseCurrencyCode) =>
        this.page.getByTestId(`@trading/form/fiat-currency-select/option/${currency}`);
    readonly youPayFiatCryptoSwitchButton: Locator;
    readonly youPayCryptoInput: Locator;
    readonly cryptoInputFractionButtons: Locator;
    readonly cryptoInputBottomText: Locator;
    readonly countryOfResidenceDropdown: Locator;
    readonly countryOfResidenceOption = (countryCode: string) =>
        this.page.getByTestId(`@trading/form/country-select/option/${countryCode}`);

    readonly paymentMethodDropdown: Locator;
    readonly paymentMethodOption = (method: PaymentMethods) =>
        this.page.getByTestId(`@trading/form/payment-method-select/option/${method}`);
    readonly buyOffersPage: Locator;
    readonly selectedOfferProvider: Locator;
    readonly quotes: Locator;
    readonly quoteOfProvider = (provider: string) =>
        this.page.getByTestId(`@trading/offers/quote-${provider}`);
    readonly refreshTime: Locator;
    readonly selectThisQuoteButton: Locator;
    readonly backToAccountButton = (type: 'Buy' | 'Sell' | 'Swap') =>
        this.page.getByRole('button', { name: `Make another ${type}` });
    // Confirmation modal
    readonly modal: Locator;
    readonly confirmOnTrezorButton: Locator;
    readonly confirmationAccount: Locator;
    readonly confirmationCryptoAmount: Locator;
    readonly confirmationFiatAmount: Locator;
    readonly confirmationProvider: Locator;
    readonly confirmationAddress: Locator;
    readonly confirmationPaymentMethod: Locator;
    readonly confirmationPaymentId: Locator;
    readonly confirmationExchangeType: Locator;
    readonly confirmOnTrezorAndSend: Locator;
    // Swap
    readonly sendAddressInput: Locator;
    readonly sendAmountInput: Locator;
    readonly sendButton: Locator;
    readonly sendBalance: Locator;
    readonly setMax: Locator;
    readonly swapBestOfferButton: Locator;
    readonly swapAmountInputCurrencyTicker: Locator;
    // Transactions
    readonly transactionDetailStatus: Locator;
    readonly proceedToPayButton: Locator;
    // Sell
    readonly sellBestOfferButton: Locator;

    constructor(
        private page: Page,
        private readonly devicePrompt: DevicePrompt,
    ) {
        this.fees = new FeeSection(page);
        this.assets = new Assets(page);
        this.receiveAccount = new ReceiveAccount(page);

        this.offerSpinner = this.page.getByTestId('@trading/offers/loading-spinner');
        this.section = this.page.getByTestId('@trading');
        this.buyButton = this.page.getByTestId('@trading/menu/wallet-trading-buy');
        this.sellTabButton = this.page.getByTestId('@trading/menu/wallet-trading-sell');
        this.quoteProvider = this.page.getByTestId(quoteProviderLocator);
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
        this.cryptoInputFractionButtons = this.page.getByTestId('@trading/form/fraction-buttons');
        this.cryptoInputBottomText = this.page.getByTestId(
            '@trading/form/crypto-input/bottom-text',
        );
        this.countryOfResidenceDropdown = this.page.getByTestId(
            '@trading/form/country-select/input',
        );

        this.paymentMethodDropdown = this.page.getByTestId(
            '@trading/form/payment-method-select/input',
        );
        this.buyOffersPage = this.page.getByTestId('@trading/buy-offers');
        this.selectedOfferProvider = this.page.getByTestId('@trading/selected-offer-provider');
        this.quotes = this.page.getByTestId('@trading/offers/quote');
        this.refreshTime = this.page.getByTestId('@trading/refresh-time-text');
        this.selectThisQuoteButton = this.page.getByTestId('@trading/offers/get-this-deal-button');
        // Confirmation modal
        this.modal = this.page.modal;
        this.confirmOnTrezorButton = this.page.getByTestId(
            '@trading/offer/confirm-on-trezor-button',
        );
        this.confirmationAccount = this.page.getByTestId('@trading/form/verify/account');
        this.confirmationCryptoAmount = this.page.getByTestId('@trading/form/info/crypto-amount');
        this.confirmationFiatAmount = this.page.getByTestId('@trading/form/info/fiat-amount');
        this.confirmationProvider = this.page.getByTestId('@trading/form/info/provider');
        this.confirmationAddress = this.page.getByTestId('@trading/form/verify/address');
        this.confirmationPaymentMethod = this.page.getByTestId('@trading/form/info/payment-method');
        this.confirmationPaymentId = this.page.getByTestId('@trading/form/verify/extra-id');
        this.confirmationExchangeType = this.page.getByTestId('@trading/offer/info/exchange-type');
        this.confirmOnTrezorAndSend = this.page.getByTestId(
            '@trading/offer/confirm-on-trezor-and-send',
        );
        // Swap
        this.sendAddressInput = this.page.getByTestId('outputs.0.address');
        this.sendAmountInput = this.page.getByTestId('outputs.0.amount');
        this.sendButton = this.page.getByTestId('@send/review-button');
        this.sendBalance = this.page.getByTestId('outputs.0.token');
        this.setMax = this.page.getByTestId('outputs.0.setMax');
        this.swapBestOfferButton = this.page.getByTestId('@trading/form/exchange-button');
        this.swapAmountInputCurrencyTicker = this.page.getByTestId(
            '@trading/form/crypto-input/input-addon',
        );
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
    async selectCountryOfResidence(countryCode: TradingCountryCode) {
        const countryLabel = getCountryLabel(countryCode);
        const currentCountry = await this.countryOfResidenceDropdown.textContent();
        if (currentCountry === countryLabel) {
            return;
        }
        await this.page.selectDropdownOptionWithRetry(
            this.countryOfResidenceDropdown,
            this.countryOfResidenceOption(countryCode),
        );
    }

    @step()
    async selectFiatCurrency(currencyCode: BaseCurrencyCode) {
        const currentCurrency = await this.youPayCurrencyDropdown.textContent();
        if (currentCurrency === currencyCode.toUpperCase()) {
            return;
        }
        await this.page.selectDropdownOptionWithRetry(
            this.youPayCurrencyDropdown,
            this.youPayCurrencyOption(currencyCode),
        );
    }

    @step()
    async selectPaymentMethod(method: PaymentMethods) {
        await this.page.selectDropdownOptionWithRetry(
            this.paymentMethodDropdown,
            this.paymentMethodOption(method),
        );
    }

    @step()
    async fillBuyForm({
        amount,
        cryptoCurrency = 'bitcoin',
        wantCrypto = false,
        fiatCurrencyCode = 'czk',
        country = 'CZ',
        selectReceiveAddress,
    }: {
        amount: string;
        cryptoCurrency?: string;
        wantCrypto?: boolean;
        fiatCurrencyCode?: BaseCurrencyCode;
        country?: TradingCountryCode;
        selectReceiveAddress?: () => Promise<void>;
    }) {
        const inputField = wantCrypto ? this.youPayCryptoInput : this.youPayFiatInput;
        await expect(inputField).toHaveValue('');
        if (wantCrypto) {
            // The desired value is already set due to sideeffect of mocked response,
            // We clear it so we can intercept and verify request payload that is triggered by filling value.
            await inputField.fill('');
        }
        await this.selectCountryOfResidence(country);
        await this.selectFiatCurrency(fiatCurrencyCode);

        if (selectReceiveAddress) {
            await selectReceiveAddress();
        }

        const quotesRequestPromise = this.page.waitForRequest(invityEndpoint.buyQuotes);
        const quotesResponsePromise = this.page.waitForResponse(invityEndpoint.buyQuotes);
        await inputField.fill(amount);
        await expect.soft(quotesRequestPromise).toHavePayload({
            wantCrypto,
            fiatCurrency: fiatCurrencyCode.toUpperCase(),
            receiveCurrency: cryptoCurrency,
            country,
            ...(wantCrypto ? { cryptoStringAmount: amount } : { fiatStringAmount: amount }),
        });
        await quotesResponsePromise;
        await this.waitForOffersSync();
    }

    @step()
    async fillSellForm({
        cryptoAmount,
        networkSymbolOrTokenId = 'btc',
        cryptoCurrency = 'bitcoin',
        fiatCurrencyCode = 'eur',
        country = 'CZ',
    }: {
        cryptoAmount: string;
        networkSymbolOrTokenId?: string;
        cryptoCurrency?: string;
        fiatCurrencyCode?: BaseCurrencyCode;
        country?: TradingCountryCode;
    }) {
        await this.selectCountryOfResidence(country);
        await this.selectFiatCurrency(fiatCurrencyCode);
        const isFiatRateLoadingFlag = `wallet.fiat.current.${networkSymbolOrTokenId}-${fiatCurrencyCode}.isLoading`;
        await this.page.expectReduxObjectToEqual(isFiatRateLoadingFlag, false);
        const quoteRequestPromise = this.page.waitForRequest(invityEndpoint.sellQuotes);
        await this.youPayCryptoInput.fill(cryptoAmount);
        await expect(
            this.page.getByText(messages['AMOUNT_IS_NOT_ENOUGH'].defaultMessage),
            'Insufficient funds in the account to run sell flow test. Please contact the "tech_qa" Slack group immediately.',
        ).toBeHidden();
        await expect.soft(quoteRequestPromise).toHavePayload(
            {
                amountInCrypto: true,
                cryptoCurrency,
                fiatCurrency: fiatCurrencyCode.toUpperCase(),
                country,
                cryptoStringAmount: cryptoAmount,
                flows: ['BANK_ACCOUNT', 'PAYMENT_GATE'],
            },
            { omit: ['fiatStringAmount'] },
        );
        await this.waitForOffersSync();
    }

    @step()
    async fillSellFormMinimumQuoteError(
        amount: string = '0.00000001',
        country: TradingCountryCode = 'CZ',
    ) {
        await this.selectCountryOfResidence(country);
        await this.youPayCryptoInput.fill(amount);
        await this.page.waitForRequest(invityEndpoint.sellQuotes);
        await expect(
            this.page.getByText(messages['AMOUNT_IS_NOT_ENOUGH'].defaultMessage),
            'Insufficient funds in the account to run sell flow test. Please contact the "tech_qa" Slack group immediately.',
        ).toBeHidden();

        await expect(this.offerSpinner).toBeHidden({ timeout: 30000 });
    }

    @step()
    async fillSwapForm({
        sellAsset,
        buyAsset,
        receiveAddress,
        selectReceiveAddress,
        amount,
    }: {
        amount: string;
        sellAsset: Parameters<Assets['selectSellAsset']>[0] & { assetCryptoId: CryptoId };
        buyAsset: Omit<Parameters<Assets['selectBuyAsset']>[0], 'assetCryptoId'> & {
            assetCryptoId: CryptoId;
        };
        receiveAddress?: string;
        selectReceiveAddress?: () => Promise<void>;
    }) {
        await this.assets.selectSellAsset(sellAsset);
        await this.assets.selectBuyAsset(buyAsset);

        // We should not fill in amount until account change takes effect = correct ticker is displayed
        await expect(this.swapAmountInputCurrencyTicker).toHaveText(
            sellAsset.tokenSymbol ?? sellAsset.networkSymbol ?? '',
            { ignoreCase: true },
        );

        if (selectReceiveAddress) {
            await selectReceiveAddress();
        }

        const quotesRequestPromise = this.page.waitForRequest(invityEndpoint.swapQuotes);
        const quotesResponsePromise = this.page.waitForResponse(invityEndpoint.swapQuotes);
        await expect(this.bestOfferAmount).toHaveText(/0 \w+/);
        await this.youPayCryptoInput.fill(amount);
        await quotesResponsePromise;
        await this.waitForOffersSync();
        await expect.soft(quotesRequestPromise).toHavePayload(
            {
                receive: buyAsset.assetCryptoId,
                send: sellAsset.assetCryptoId,
                sendStringAmount: amount,
                dex: 'enable',
                receiveAddress,
            },
            { omit: ['fromAddress'] },
        );
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
        await this.confirmOnTrezorAndSend.click({ timeout: 30_000 });
        await expect(this.modal).toBeVisible();
        await expect(this.devicePrompt.sendButton).toBeDisabled();
    }

    @step()
    async getSelectedPaymentMethod() {
        await expect(this.paymentMethodDropdown).not.toBeEmpty();
        const dropdownText = (await this.paymentMethodDropdown.textContent())?.trim();
        if (!dropdownText) {
            throw new Error('Payment method dropdown is empty');
        }

        const mapped = paymentMethodNameMap[dropdownText];
        if (!mapped) {
            throw new Error(`Unknown payment method "${dropdownText}"`);
        }

        return mapped;
    }

    @step()
    private async validateQuotes({
        quotesResponse,
        listType,
        amountElementID,
        formatExpectedAmount,
    }: {
        quotesResponse: any[];
        listType: 'buyList' | 'sellList';
        amountElementID: string;
        formatExpectedAmount: (quote: any) => string;
    }) {
        const paymentMethod = await this.getSelectedPaymentMethod();
        const expectedQuotes = quotesResponse.filter(
            quote => quote.paymentMethod === paymentMethod && quote.error === undefined,
        );
        expect.soft(await this.quotes.count()).toBe(expectedQuotes.length);

        const displayedQuotes = await this.quotes.all();
        for (const [index, quote] of displayedQuotes.entries()) {
            //validate provider of the quote row
            const provider = quote.getByTestId(quoteProviderLocator);
            const expectedProvider = getCompanyNameFromList(
                expectedQuotes[index].exchange,
                listType,
            );
            await expect.soft(provider).toHaveText(expectedProvider);
            //validate amount of the quote row
            const amount = quote.getByTestId(amountElementID);
            const expectedAmount = formatExpectedAmount(expectedQuotes[index]);
            await expect.soft(amount).toHaveText(expectedAmount);
        }
    }

    @step()
    async validateBuyQuotes(quotesResponse: any[]) {
        await this.validateQuotes({
            quotesResponse,
            listType: 'buyList',
            amountElementID: '@trading/offers/quote/crypto-amount-with-symbol',
            formatExpectedAmount: quote => `${quote.receiveStringAmount} BTC`,
        });
    }

    @step()
    async validateSellQuotes(quotesResponse: any[]) {
        await this.validateQuotes({
            quotesResponse,
            listType: 'sellList',
            amountElementID: '@trading/offers/quote/amount',
            formatExpectedAmount: quote => `€${parseFloat(quote.fiatStringAmount).toFixed(2)}`,
        });
    }

    @step()
    async waitForRedirectCompletion() {
        await expect(this.page.getByText('Buy & sell')).toBeHidden();
        await expect(this.page.getByText('Buy & sell')).toBeVisible({ timeout: 30_000 });
    }

    @step()
    async verifyBuyFormOpened(displaySymbol: RegExp) {
        await expect.soft(this.assets.buyAssetPickerDisplaySymbol).toHaveText(displaySymbol);
        await expect.soft(this.page.getByText('You buy')).toBeVisible();
    }

    @step()
    async verifySellFormOpened(displaySymbol: RegExp) {
        await expect.soft(this.assets.sellAssetPickerDisplaySymbol).toHaveText(displaySymbol);
        await expect.soft(this.page.getByText('You sell')).toBeVisible();
    }

    @step()
    async verifySwapFormOpened(displaySymbol: RegExp) {
        await expect.soft(this.assets.sellAssetPickerDisplaySymbol).toHaveText(displaySymbol);
        await expect.soft(this.page.getByText('Swap amount')).toBeVisible();
    }

    @step()
    async expectInputToBe(params: PercentageOfBalanceParams) {
        const expectedValue = calculatePercentageOfBalance(params);
        await expect.soft(this.youPayCryptoInput).toHaveValue(expectedValue);
    }
}
