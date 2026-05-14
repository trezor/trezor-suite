import { type TradingFiatCurrencyOption } from '@suite-common/trading';
import { type BaseCurrencyOption } from '@suite-common/wallet-types';

import { type CurrencyPickerOption } from '../types/currencyPickerTypes';

export const mapCurrencyToCurrencyPickerOption = (
    currency: TradingFiatCurrencyOption | BaseCurrencyOption,
): CurrencyPickerOption => ({
    value: currency.value,
    label: currency.label,
    shortLabel: currency.value.toUpperCase(),
});

export const mapCurrenciesToCurrencyPickerOptions = (
    currencies: (TradingFiatCurrencyOption | BaseCurrencyOption)[],
): CurrencyPickerOption[] => currencies.map(mapCurrencyToCurrencyPickerOption);
