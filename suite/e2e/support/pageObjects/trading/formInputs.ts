import { Locator, Page } from '@playwright/test';

import type { TradingCountryCode } from '@suite-common/trading';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { calculatePercentageOfBalance, step } from '../../common';
import { expect } from '../../testExtends/customMatchers';
import { PaymentMethods, PercentageOfBalanceParams } from '../../types';

const paymentMethodNameMap: Record<string, PaymentMethods> = {
    'Credit/Debit Card': 'creditCard',
    'Bank Transfer': 'bankTransfer',
    'Google Pay': 'googlePay',
    'Apple Pay': 'applePay',
    Paypal: 'paypal',
    'Revolut Pay': 'revolutPay',
};

export class TradingFormInputs {
    readonly fiatAmount: Locator;
    readonly cryptoAmount: Locator;
    readonly currencySelect: Locator;
    readonly currencyOption = (currency: BaseCurrencyCode) =>
        this.page.getByTestId(`@trading/form/currency-picker/option/${currency}`);
    readonly fiatCryptoSwitchButton: Locator;
    readonly fractionButtons: Locator;
    readonly bottomText: Locator;
    readonly countrySelect: Locator;
    readonly countryValue: Locator;
    readonly countryOption = (countryCode: TradingCountryCode) =>
        this.page.getByTestId(`@trading/form/country-select/option/${countryCode}`);
    readonly paymentMethodSelect: Locator;
    readonly paymentMethodValue: Locator;
    readonly paymentMethodOption = (method: PaymentMethods) =>
        this.page.getByTestId(`@trading/form/payment-method-select/option/${method}`);
    readonly swapAmountCurrencyTicker: Locator;

    constructor(private readonly page: Page) {
        this.fiatAmount = this.page.getByTestId('@trading/form/fiat-input');
        this.cryptoAmount = this.page.getByTestId('@trading/form/crypto-input');
        this.currencySelect = this.page.getByTestId('@trading/form/currency-picker/input');
        this.fiatCryptoSwitchButton = this.page.getByTestId('@trading/form/switch-crypto-fiat');
        this.fractionButtons = this.page.getByTestId('@trading/form/fraction-buttons');
        this.bottomText = this.page.getByTestId('@trading/form/crypto-input/bottom-text');
        this.countrySelect = this.page.getByTestId('@trading/form/country-select');
        this.countryValue = this.page.getByTestId('@trading/form/country-select/value');
        this.paymentMethodSelect = this.page.getByTestId('@trading/form/payment-method-select');
        this.paymentMethodValue = this.page.getByTestId(
            '@trading/form/payment-method-select/value',
        );
        this.swapAmountCurrencyTicker = this.page.getByTestId(
            '@trading/form/crypto-input/input-addon',
        );
    }

    @step()
    async selectCountryOfResidence(countryCode: TradingCountryCode) {
        const currentCountry = await this.countryValue.textContent();
        if (currentCountry?.includes(countryCode)) {
            return;
        }
        await this.countrySelect.click();
        await expect(this.page.getByTestId('@modal/header')).toHaveTranslation(
            'TR_TRADING_COUNTRY',
        );
        await this.countryOption(countryCode).click();
        await expect(this.countryValue).toContainText(countryCode);
    }

    @step()
    async selectFiatCurrency(currencyCode: BaseCurrencyCode) {
        await expect(this.currencySelect).not.toBeEmpty();
        const currentCurrency = (await this.currencySelect.inputValue())?.trim();
        if (currentCurrency === currencyCode.toUpperCase()) {
            return;
        }
        await this.currencySelect.click();
        await expect(this.page.getByTestId('@modal/header')).toHaveTranslation('TR_CURRENCY');
        await this.currencyOption(currencyCode).click();
        await expect(this.currencySelect).toHaveValue(currencyCode.toUpperCase());
    }

    @step()
    async selectPaymentMethod(method: PaymentMethods) {
        const currentPaymentMethod = await this.paymentMethodSelect.getAttribute('value');
        if (currentPaymentMethod?.includes(method)) {
            return;
        }
        await this.paymentMethodSelect.click();
        await expect(this.page.getByTestId('@modal/header')).toHaveTranslation(
            'TR_TRADING_PAYMENT_METHOD',
        );
        await this.paymentMethodOption(method).click();
    }

    getSelectedPaymentMethod = async () => {
        await expect(this.paymentMethodSelect).not.toBeEmpty();
        const dropdownText = (await this.paymentMethodSelect.getAttribute('value'))?.trim();
        if (!dropdownText) {
            throw new Error('Payment method dropdown is empty');
        }

        const mapped = paymentMethodNameMap[dropdownText];
        if (!mapped) {
            throw new Error(`Unknown payment method "${dropdownText}"`);
        }

        return mapped;
    };

    @step()
    async expectInputToBe(params: PercentageOfBalanceParams) {
        const expectedValue = calculatePercentageOfBalance(params);
        await expect.soft(this.cryptoAmount).toHaveValue(expectedValue);
    }
}
