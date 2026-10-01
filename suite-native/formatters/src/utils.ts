import { type Branded } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

// A token amount guaranteed to be in decimal units, not base units. Token formatters accept only this.
export type DecimalTokenAmount = string & Branded<'DecimalTokenAmount'>;

// Base units → decimal.
export const convertTokenValueToDecimal = (
    value: string | number,
    decimals: number,
): DecimalTokenAmount =>
    BigNumber(value).div(BigNumber(10).exponentiatedBy(decimals)).toString() as DecimalTokenAmount;

// For values already in decimal units.
export const asDecimalTokenAmount = (value: string | number): DecimalTokenAmount =>
    value.toString() as DecimalTokenAmount;

type GetFormattedCurrencySymbolParams = {
    locale: string;
    currency: string;
    isSatsValue: boolean;
};

export const getFormattedCurrencySymbol = ({
    locale,
    currency,
    isSatsValue,
}: GetFormattedCurrencySymbolParams) => {
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
