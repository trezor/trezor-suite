import { useSelector } from 'react-redux';

import { selectBaseCurrency, selectIsBaseCurrencyInSats } from '@suite-common/wallet-core';
import { selectLocale } from '@suite-native/intl';

const MAX_DECIMALS_LENGTH = 2;

const getFormattedWholeNumber = ({ value, locale }: { value: string; locale: string }) => {
    const formatter = new Intl.NumberFormat(locale);

    return formatter.format(Number(value));
};

const getDecimalSeparator = (locale: string) => {
    const formatter = new Intl.NumberFormat(locale, { minimumFractionDigits: 1 });

    // we can not use formatter.formatToParts because it is not supported on iOS
    // for this reason we need to use a regex on a dummy 0.1 value to get the decimal separator.
    const formattedValue = formatter.format(Number(0.1));
    const numericRegex = /[\d]+/g;
    const cleanedDecimalSeparator = formattedValue.replace(numericRegex, '');

    return cleanedDecimalSeparator;
};

const getFormattedDecimalNumber = ({
    value = '00',
    locale,
    isSatsValue,
}: {
    value: string | undefined;
    locale: string;
    isSatsValue: boolean;
}) => {
    if (isSatsValue) {
        return '';
    }

    const decimalSeparator = getDecimalSeparator(locale);

    return `${decimalSeparator}${value.slice(0, MAX_DECIMALS_LENGTH)}`;
};

const getFormattedCurrencySymbol = ({
    locale,
    currency,
    isSatsValue,
}: {
    locale: string;
    currency: string;
    isSatsValue: boolean;
}) => {
    if (isSatsValue) {
        return 'sat';
    }

    const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currencyDisplay: 'symbol',
        currency,
        maximumFractionDigits: 0,
    });

    // we can not use formatter.formatToParts because it is not supported on iOS
    // for this reason we need to use a regex on a dummy 0 value to get the currency symbol
    const formattedValue = formatter.format(0);
    const regex = /[\s0]+/g;
    const cleanedCurrencySymbol = formattedValue.replace(regex, '');

    return cleanedCurrencySymbol;
};

export const useFormattedGraphHeaderValues = (value: string = '0') => {
    const locale = useSelector(selectLocale);
    const baseCurrency = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);

    const isSatsValue = isBaseCurrencyInSats && baseCurrency === 'btc';

    const numericValue = isSatsValue ? Number(value) * 100_000_000 : Number(value);
    const parts = numericValue.toFixed(MAX_DECIMALS_LENGTH).toString().split('.');
    const integerPart = parts[0] ?? '0';
    const decimalPart = parts[1] ?? '0';

    return {
        currencySymbol: getFormattedCurrencySymbol({ locale, currency: baseCurrency, isSatsValue }),
        wholeNumber: getFormattedWholeNumber({ value: integerPart, locale }),
        decimalNumber: getFormattedDecimalNumber({ value: decimalPart, locale, isSatsValue }),
    };
};
