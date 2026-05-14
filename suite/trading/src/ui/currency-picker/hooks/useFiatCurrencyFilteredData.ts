import { useListDataFilter } from '@suite-common/trading';

import { type CurrencyPickerOption } from '../types/currencyPickerTypes';

const filterCallback = ({ label, value }: CurrencyPickerOption, filterValue: string): boolean =>
    label.toLowerCase().includes(filterValue.toLowerCase()) ||
    value.toLowerCase().includes(filterValue.toLowerCase());

export const useFiatCurrencyFilteredData = (supportedFiatCurrencies: CurrencyPickerOption[]) =>
    useListDataFilter<CurrencyPickerOption>(supportedFiatCurrencies, filterCallback);
