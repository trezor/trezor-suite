const MAX_DECIMALS_LENGTH = 2;
const SATOSHIS_IN_BITCOIN = 100_000_000;

type WholeNumberParams = {
    value: string;
    locale: string;
};

const getFormattedWholeNumber = ({ value, locale }: WholeNumberParams) =>
    new Intl.NumberFormat(locale).format(Number(value));

const getDecimalSeparator = (locale: string) => {
    const formatter = new Intl.NumberFormat(locale, { minimumFractionDigits: 1 });

    // we can not use formatter.formatToParts because it is not supported on iOS
    // for this reason we need to use a regex on a dummy 0.1 value to get the decimal separator.
    const formattedValue = formatter.format(Number(0.1));
    const numericRegex = /[\d]+/g;

    return formattedValue.replace(numericRegex, '');
};

type DecimalNumberParams = {
    value: string | undefined;
    locale: string;
    isSatsValue: boolean;
};

const getFormattedDecimalNumber = ({ value = '00', locale, isSatsValue }: DecimalNumberParams) =>
    isSatsValue ? '' : `${getDecimalSeparator(locale)}${value.slice(0, MAX_DECIMALS_LENGTH)}`;

type CurrencySymbolParams = {
    locale: string;
    currency: string;
    isSatsValue: boolean;
};

const isCurrencySymbolFirstInLocale = ({ locale, currency, isSatsValue }: CurrencySymbolParams) => {
    if (isSatsValue) {
        return false;
    }

    // Same reason as above: a dummy 0 says where the locale puts the symbol without formatToParts.
    const formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currencyDisplay: 'symbol',
        currency,
        maximumFractionDigits: 0,
    }).format(0);

    return formatted.indexOf('0') > 0;
};

const getFormattedCurrencySymbol = ({ locale, currency, isSatsValue }: CurrencySymbolParams) => {
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

    return formattedValue.replace(regex, '');
};

export type CurrencyAmountParts = {
    currencySymbol: string;
    wholeNumber: string;
    decimalNumber: string;
    /** Whether the locale writes the symbol before the amount — `$1.00`, against `1,00 €`. */
    isCurrencySymbolFirst: boolean;
};

type CurrencyAmountPartsParams = CurrencySymbolParams & {
    value?: string;
};

/**
 * An amount split into the pieces a headline renders apart: the symbol, the whole of it, and
 * whatever is left over.
 */
export const getCurrencyAmountParts = ({
    value = '0',
    locale,
    currency,
    isSatsValue,
}: CurrencyAmountPartsParams): CurrencyAmountParts => {
    const numericValue = isSatsValue ? Number(value) * SATOSHIS_IN_BITCOIN : Number(value);
    const [integerPart = '0', decimalPart = '0'] = numericValue
        .toFixed(MAX_DECIMALS_LENGTH)
        .toString()
        .split('.');

    return {
        currencySymbol: getFormattedCurrencySymbol({ locale, currency, isSatsValue }),
        wholeNumber: getFormattedWholeNumber({ value: integerPart, locale }),
        decimalNumber: getFormattedDecimalNumber({ value: decimalPart, locale, isSatsValue }),
        isCurrencySymbolFirst: isCurrencySymbolFirstInLocale({ locale, currency, isSatsValue }),
    };
};
