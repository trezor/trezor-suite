import { Locator, Page } from '@playwright/test';
import { CryptoId } from 'invity-api';

import { messages } from '@suite/intl';
import { TradingCountryCode } from '@suite-common/trading';
import { NetworkConfigWithoutTestnets, NetworkSymbol } from '@suite-common/wallet-config';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { FeeSection } from './feeSection';
import { getCompanyNameFromList, invityEndpoint } from '../../fixtures/invity';
import { calculatePercentageOfBalance, getCountryLabel, step } from '../common';
import { expect } from '../testExtends/customMatchers';
import { PaymentMethods, PercentageOfBalanceParams } from '../types';
import { DevicePrompt } from './devicePrompt';

const quoteProviderLocator = '@trading/offers/quote/provider';

const paymentMethodNameMap: Record<string, PaymentMethods> = {
    'Credit/Debit Card': 'creditCard',
    'Bank Transfer': 'bankTransfer',
    'Google Pay': 'googlePay',
    'Apple Pay': 'applePay',
    Paypal: 'paypal',
    'Revolut Pay': 'revolutPay',
};

type AssetPickerNetworkFilter = 'all-networks' | NetworkConfigWithoutTestnets['symbol'];

export class TradingPage {
    readonly fees: FeeSection;

    // Input and general
    readonly offerSpinner: Locator;
    readonly section: Locator;
    readonly form: Locator;
    readonly buyButton: Locator;
    readonly sellTabButton: Locator;
    readonly quoteProvider: Locator;
    readonly bestOfferSection: Locator;
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

    // `From` field asset picker in swap/sell form
    readonly sellAssetPickerInput: Locator;
    readonly sellAssetPickerSearchInput: Locator;
    readonly sellAssetPickerNetworkFilter: Locator;
    readonly sellAssetPickerDisplaySymbol: Locator;

    readonly sellAssetPickerNetworkFilterOption = (tab: AssetPickerNetworkFilter) =>
        this.page.getByTestId(`@trading/form/select-crypto-for-sell/search/select-option/${tab}`);

    readonly sellAssetPickerTokenOption = (networkSymbol?: NetworkSymbol, tokenSymbol?: string) =>
        this.page.getByTestId(
            `@trading/form/select-crypto-for-sell/token/${networkSymbol}/${tokenSymbol}`,
        );
    readonly sellAssetPickerAccountOption = (networkSymbol?: NetworkSymbol) =>
        this.page.getByTestId(`@trading/form/select-crypto-for-sell/account/${networkSymbol}`);

    // `To` field asset picker in swap/buy form
    readonly buyAssetPickerInput: Locator;
    readonly buyAssetPickerSearchInput: Locator;
    readonly buyAssetPickerNetworkFilter: Locator;
    readonly buyAssetPickerDisplaySymbol: Locator;

    readonly buyAssetPickerNetworkFilterOption = (tab: AssetPickerNetworkFilter) =>
        this.page.getByTestId(`@trading/form/select-crypto-for-buy/search/select-option/${tab}`);

    readonly buyAssetPickerTokenOption = (networkSymbol?: NetworkSymbol, tokenSymbol?: string) =>
        this.page.getByTestId(
            `@trading/form/select-crypto-for-buy/token/${networkSymbol}/${tokenSymbol}`,
        );
    readonly buyAssetPickerAccountOption = (networkSymbol?: NetworkSymbol) =>
        this.page.getByTestId(`@trading/form/select-crypto-for-buy/account/${networkSymbol}`);
    readonly buyAssetPickerTopAssetOption = (id: CryptoId) =>
        this.page.getByTestId(`@trading/form/select-crypto-for-buy/top-assets/asset/${id}`);
    readonly buyAssetPickerAssetOption = (id: CryptoId) =>
        this.page.getByTestId(`@trading/form/select-crypto-for-buy/asset/${id}`);

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

    // receive account & receive address
    readonly receiveAddressPicker: Locator;
    readonly selectedReceiveAccount: Locator;

    readonly receiveAccountModal: Locator;
    readonly receiveAccountModalSuiteOption: Locator;
    readonly receiveAccountModalAddSuiteOption: Locator;
    readonly receiveAccountModalNonSuiteOption: Locator;

    readonly receiveAddressModal: Locator;
    readonly receiveAddressModalConfirmButton: Locator;
    readonly receiveAddressInput: Locator;

    readonly extraFieldModal: Locator;
    readonly extraFieldModalConfirmButton: Locator;
    readonly extraFieldSwitch: Locator;
    readonly extraFieldInput: Locator;

    readonly bitcoinReceiveAddressModal: Locator;
    readonly bitcoinReceiveAddressModalOption: Locator;

    readonly findAccountButton: Locator;

    constructor(
        private page: Page,
        private readonly devicePrompt: DevicePrompt,
    ) {
        this.fees = new FeeSection(page);

        this.offerSpinner = this.page.getByTestId('@trading/offers/loading-spinner');
        this.section = this.page.getByTestId('@trading');
        this.form = this.page.getByTestId('@trading/form');
        this.buyButton = this.page.getByTestId('@trading/menu/wallet-trading-buy');
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
        this.cryptoInputFractionButtons = this.page.getByTestId('@trading/form/fraction-buttons');
        this.cryptoInputBottomText = this.page.getByTestId(
            '@trading/form/crypto-input/bottom-text',
        );
        this.countryOfResidenceDropdown = this.page.getByTestId(
            '@trading/form/country-select/input',
        );

        this.sellAssetPickerInput = this.page.getByTestId(
            '@trading/form/select-crypto-for-sell/input',
        );
        this.sellAssetPickerDisplaySymbol = this.page.getByTestId(
            '@trading/form/select-crypto-for-sell/display-symbol',
        );
        this.sellAssetPickerSearchInput = this.page.getByTestId(
            '@trading/form/select-crypto-for-sell/search',
        );
        this.sellAssetPickerNetworkFilter = this.page.getByTestId(
            '@trading/form/select-crypto-for-sell/search/select/input',
        );

        this.buyAssetPickerInput = this.page.getByTestId(
            '@trading/form/select-crypto-for-buy/input',
        );
        this.buyAssetPickerDisplaySymbol = this.page.getByTestId(
            '@trading/form/select-crypto-for-buy/display-symbol',
        );
        this.buyAssetPickerSearchInput = this.page.getByTestId(
            '@trading/form/select-crypto-for-buy/search',
        );
        this.buyAssetPickerNetworkFilter = this.page.getByTestId(
            '@trading/form/select-crypto-for-buy/search/select/input',
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

        // receive account & receive address
        this.receiveAddressPicker = this.page.getByTestId('@trading/receive-address-picker');
        this.selectedReceiveAccount = this.page.getByTestId('@trading/selected-receive-account');

        this.receiveAccountModal = this.page.getByTestId('@trading/receive-account-modal');
        this.receiveAccountModalSuiteOption = this.page.getByTestId(
            '@trading/receive-account-modal/option/suite',
        );
        this.receiveAccountModalAddSuiteOption = this.page.getByTestId(
            '@trading/receive-account-modal/option/add-suite',
        );
        this.receiveAccountModalNonSuiteOption = this.page.getByTestId(
            '@trading/receive-account-modal/option/non-suite',
        );

        this.receiveAddressModal = this.page.getByTestId('@trading/receive-address-modal');
        this.receiveAddressModalConfirmButton = this.page.getByTestId(
            '@trading/receive-address-modal/confirm-button',
        );
        this.receiveAddressInput = this.page.getByTestId('@trading/receive-address-input');

        this.extraFieldModal = this.page.getByTestId('@trading/extra-field-modal');
        this.extraFieldModalConfirmButton = this.page.getByTestId(
            '@trading/extra-field-modal/confirm-button',
        );
        this.extraFieldSwitch = this.page.getByTestId('@trading/extra-field-switch');
        this.extraFieldInput = this.page.getByTestId('@trading/extra-field-input');

        this.bitcoinReceiveAddressModal = this.page.getByTestId(
            '@trading/bitcoin-receive-address-modal',
        );
        this.bitcoinReceiveAddressModalOption = this.page.getByTestId(
            '@trading/bitcoin-receive-address-modal/option',
        );

        this.findAccountButton = this.page.getByTestId('@find-account');
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
    async selectSellAsset({
        searchFilter,
        networkFilter,
        networkSymbol,
        tokenSymbol,
    }: {
        searchFilter?: string;
        networkFilter?: AssetPickerNetworkFilter;
        networkSymbol?: NetworkSymbol;
        tokenSymbol?: string;
    }) {
        await this.sellAssetPickerInput.click();

        if (networkFilter) {
            await this.sellAssetPickerNetworkFilter.click();
            await this.sellAssetPickerNetworkFilterOption(networkFilter).click();
        }

        if (searchFilter) {
            await this.sellAssetPickerSearchInput.pressSequentially(searchFilter, { delay: 250 });
            await this.sellAssetPickerSearchInput.blur();
        }

        if (networkSymbol && tokenSymbol) {
            await this.sellAssetPickerTokenOption(networkSymbol, tokenSymbol).click();
        } else if (networkSymbol) {
            await this.sellAssetPickerAccountOption(networkSymbol).click();
        }
    }

    @step()
    async selectBuyAsset({
        searchFilter,
        networkFilter,
        assetCryptoId,
        networkSymbol,
        tokenSymbol,
    }: {
        searchFilter?: string;
        networkFilter?: AssetPickerNetworkFilter;

        assetCryptoId?: CryptoId;
        networkSymbol?: NetworkSymbol;
        tokenSymbol?: string;
    }) {
        await this.buyAssetPickerInput.click();

        if (networkFilter) {
            await this.buyAssetPickerNetworkFilter.click();
            await this.buyAssetPickerNetworkFilterOption(networkFilter).click();
        }

        if (searchFilter) {
            await this.buyAssetPickerSearchInput.pressSequentially(searchFilter, { delay: 250 });
            await this.buyAssetPickerSearchInput.blur();
        }

        if (networkSymbol && tokenSymbol) {
            await this.buyAssetPickerTokenOption(networkSymbol, tokenSymbol).click();
        } else if (networkSymbol) {
            await this.buyAssetPickerAccountOption(networkSymbol).click();
        } else if (assetCryptoId) {
            await this.buyAssetPickerAssetOption(assetCryptoId).click();
        }
    }

    @step()
    async selectPaymentMethod(method: PaymentMethods) {
        await this.page.selectDropdownOptionWithRetry(
            this.paymentMethodDropdown,
            this.paymentMethodOption(method),
        );
    }

    @step()
    async selectSuiteReceiveAccount(index: number, symbol?: NetworkSymbol) {
        await this.receiveAddressPicker.click();
        await expect(this.receiveAccountModal).toBeVisible();

        await this.receiveAccountModalSuiteOption.nth(index).click();

        if (symbol === 'btc') {
            await expect(this.bitcoinReceiveAddressModal).toBeVisible();
            await this.bitcoinReceiveAddressModalOption.nth(0).click();
            await expect(this.bitcoinReceiveAddressModal).toBeHidden();
        }

        await expect(this.receiveAccountModal).toBeHidden();
    }

    @step()
    async selectNonSuiteReceiveAccount(receiveAddress: string, extraField?: string) {
        await this.receiveAddressPicker.click();
        await expect(this.receiveAccountModal).toBeVisible();

        await this.receiveAccountModalNonSuiteOption.nth(0).click();
        await this.receiveAddressInput.fill(receiveAddress);

        if (extraField) {
            await expect(this.extraFieldSwitch).not.toBeChecked();
            await this.extraFieldSwitch.check();
            await this.extraFieldInput.fill(extraField);
        }

        await this.receiveAddressModalConfirmButton.click();
    }

    @step()
    async selectAddSuiteReceiveAccount(index: number) {
        await this.receiveAddressPicker.click();
        await expect(this.receiveAccountModal).toBeVisible();

        await this.receiveAccountModalAddSuiteOption.nth(0).click();
        await this.findAccountButton.click();

        await this.page.discoveryShouldFinish();

        await expect(this.receiveAccountModal).toBeVisible();
        await this.receiveAccountModalSuiteOption.nth(index).click();
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
        sellAsset: Parameters<TradingPage['selectSellAsset']>[0] & { assetCryptoId: CryptoId };
        buyAsset: Omit<Parameters<TradingPage['selectBuyAsset']>[0], 'assetCryptoId'> & {
            assetCryptoId: CryptoId;
        };
        receiveAddress?: string;
        selectReceiveAddress?: () => Promise<void>;
    }) {
        await this.selectSellAsset(sellAsset);
        await this.selectBuyAsset(buyAsset);

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
        await expect.soft(this.buyAssetPickerDisplaySymbol).toHaveText(displaySymbol);
        await expect.soft(this.page.getByText('You buy')).toBeVisible();
    }

    @step()
    async verifySellFormOpened(displaySymbol: RegExp) {
        await expect.soft(this.sellAssetPickerDisplaySymbol).toHaveText(displaySymbol);
        await expect.soft(this.page.getByText('You sell')).toBeVisible();
    }

    @step()
    async verifySwapFormOpened(displaySymbol: RegExp) {
        await expect.soft(this.sellAssetPickerDisplaySymbol).toHaveText(displaySymbol);
        await expect.soft(this.page.getByText('Swap amount')).toBeVisible();
    }

    @step()
    async expectInputToBe(params: PercentageOfBalanceParams) {
        const expectedValue = calculatePercentageOfBalance(params);
        await expect.soft(this.youPayCryptoInput).toHaveValue(expectedValue);
    }
}
