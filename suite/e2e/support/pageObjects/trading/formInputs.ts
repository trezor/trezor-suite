import { Locator, Page } from '@playwright/test';

import { TradingCountryCode } from '@suite-common/trading';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { calculatePercentageOfBalance, getCountryLabel, step } from '../../common';
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
    readonly currencyDropdown: Locator;
    readonly currencyOption = (currency: BaseCurrencyCode) =>
        this.page.getByTestId(`@trading/form/fiat-currency-select/option/${currency}`);
    readonly fiatCryptoSwitchButton: Locator;
    readonly fractionButtons: Locator;
    readonly bottomText: Locator;
    readonly countryDropdown: Locator;
    readonly countryOption = (countryCode: string) =>
        this.page.getByTestId(`@trading/form/country-select/option/${countryCode}`);
    readonly paymentMethodDropdown: Locator;
    readonly paymentMethodOption = (method: PaymentMethods) =>
        this.page.getByTestId(`@trading/form/payment-method-select/option/${method}`);
    readonly swapAmountCurrencyTicker: Locator;

    constructor(private readonly page: Page) {
        this.fiatAmount = this.page.getByTestId('@trading/form/fiat-input');
        this.cryptoAmount = this.page.getByTestId('@trading/form/crypto-input');
        this.currencyDropdown = this.page.getByTestId('@trading/form/fiat-currency-select/input');
        this.fiatCryptoSwitchButton = this.page.getByTestId('@trading/form/switch-crypto-fiat');
        this.fractionButtons = this.page.getByTestId('@trading/form/fraction-buttons');
        this.bottomText = this.page.getByTestId('@trading/form/crypto-input/bottom-text');
        this.countryDropdown = this.page.getByTestId('@trading/form/country-select/input');
        this.paymentMethodDropdown = this.page.getByTestId(
            '@trading/form/payment-method-select/input',
        );
        this.swapAmountCurrencyTicker = this.page.getByTestId(
            '@trading/form/crypto-input/input-addon',
        );
    }

    @step()
    async selectCountryOfResidence(countryCode: TradingCountryCode) {
        const countryLabel = getCountryLabel(countryCode);
        const currentCountry = await this.countryDropdown.textContent();
        if (currentCountry === countryLabel) {
            return;
        }
        await this.page.selectDropdownOptionWithRetry(
            this.countryDropdown,
            this.countryOption(countryCode),
        );
    }

    @step()
    async selectFiatCurrency(currencyCode: BaseCurrencyCode) {
        const currentCurrency = await this.currencyDropdown.textContent();
        if (currentCurrency === currencyCode.toUpperCase()) {
            return;
        }
        await this.page.selectDropdownOptionWithRetry(
            this.currencyDropdown,
            this.currencyOption(currencyCode),
        );
    }

    @step()
    async selectPaymentMethod(method: PaymentMethods) {
        await this.page.selectDropdownOptionWithRetry(
            this.paymentMethodDropdown,
            this.paymentMethodOption(method),
        );
    }

    getSelectedPaymentMethod = async () => {
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
    };

    @step()
    async expectInputToBe(params: PercentageOfBalanceParams) {
        const expectedValue = calculatePercentageOfBalance(params);
        await expect.soft(this.cryptoAmount).toHaveValue(expectedValue);
    }
}
