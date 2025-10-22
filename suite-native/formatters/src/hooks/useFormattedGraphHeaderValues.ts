import { useSelector } from 'react-redux';

import { selectBaseCurrency, selectIsBaseCurrencyInSats } from '@suite-common/wallet-core';
import { useLocale } from '@suite-native/intl';

const FIAT_CURRENCY_DECIMALS_LENGTH = 2;
const BTC_CURRENCY_DECIMALS_LENGTH = 0;

const getFormattedWholeNumber = (value: Intl.NumberFormatPart[]) =>
    value
        .filter(part => part.type === 'integer' || part.type === 'group')
        ?.reduce((acc, part) => acc + part.value, '') ?? null;

const getFormattedDecimalNumber = (value: Intl.NumberFormatPart[]) => {
    const decimalDigits = value.find(part => part.type === 'fraction')?.value ?? null;
    const decimalSeparator = value.find(part => part.type === 'decimal')?.value ?? '.';

    return decimalDigits ? `${decimalSeparator}${decimalDigits}` : '';
};

const getFormattedCurrencySymbol = (value: Intl.NumberFormatPart[], isSatsValue: boolean) =>
    isSatsValue ? 'sat' : (value.find(part => part.type === 'currency')?.value ?? null);

export const useFormattedGraphHeaderValues = (value?: string) => {
    const locale = useLocale();
    const baseCurrency = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);

    const isSatsValue = isBaseCurrencyInSats && baseCurrency === 'btc';
    const minimumFractionDigits =
        baseCurrency === 'btc' && !isBaseCurrencyInSats
            ? FIAT_CURRENCY_DECIMALS_LENGTH
            : BTC_CURRENCY_DECIMALS_LENGTH;
    const maximumFractionDigits = isBaseCurrencyInSats
        ? BTC_CURRENCY_DECIMALS_LENGTH
        : FIAT_CURRENCY_DECIMALS_LENGTH;

    const formatter = new Intl.NumberFormat(locale, {
        currency: baseCurrency,
        style: 'currency',
        currencyDisplay: 'symbol',
        minimumFractionDigits,
        maximumFractionDigits,
    });

    const numericValue = isSatsValue ? Number(value) * 100_000_000 : Number(value);
    const formattedValueParts = formatter.formatToParts(numericValue);

    return {
        wholeNumber: getFormattedWholeNumber(formattedValueParts),
        currencySymbol: getFormattedCurrencySymbol(formattedValueParts, isSatsValue),
        decimalNumber: getFormattedDecimalNumber(formattedValueParts),
    };
};
