import { type TradingFiatCurrencyOption } from '@suite-common/trading';
import { type BaseCurrencyOption } from '@suite-common/wallet-types';

import {
    mapCurrenciesToCurrencyPickerOptions,
    mapCurrencyToCurrencyPickerOption,
} from '../currencyPickerMapper';

describe('currencyPickerMapper', () => {
    describe('mapCurrencyToCurrencyPickerOption', () => {
        it('maps TradingFiatCurrencyOption to CurrencyPickerOption', () => {
            const fiatCurrency: TradingFiatCurrencyOption = {
                value: 'usd',
                label: 'United States Dollar',
            };

            const result = mapCurrencyToCurrencyPickerOption(fiatCurrency);

            expect(result).toEqual({
                value: 'usd',
                label: 'United States Dollar',
                shortLabel: 'USD',
            });
        });

        it('maps BaseCurrencyOption to CurrencyPickerOption', () => {
            const baseCurrency: BaseCurrencyOption = {
                value: 'eur',
                label: 'Euro',
            };

            const result = mapCurrencyToCurrencyPickerOption(baseCurrency);

            expect(result).toEqual({
                value: 'eur',
                label: 'Euro',
                shortLabel: 'EUR',
            });
        });
    });

    describe('mapCurrenciesToCurrencyPickerOptions', () => {
        it('maps list of currencies to CurrencyPickerOptions preserving order', () => {
            const currencies: TradingFiatCurrencyOption[] = [
                {
                    value: 'usd',
                    label: 'United States Dollar',
                },
                {
                    value: 'eur',
                    label: 'Euro',
                },
            ];

            const result = mapCurrenciesToCurrencyPickerOptions(currencies);

            expect(result).toEqual([
                {
                    value: 'usd',
                    label: 'United States Dollar',
                    shortLabel: 'USD',
                },
                {
                    value: 'eur',
                    label: 'Euro',
                    shortLabel: 'EUR',
                },
            ]);
        });
    });
});
