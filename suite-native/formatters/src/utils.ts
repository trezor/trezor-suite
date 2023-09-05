import BigNumber from 'bignumber.js';

/** Matches three groups: 1. currency symbol,  2. whole number part and 3. decimal part. */
const BALANCE_PARSING_REGEX = /^(\D+)([\d,]+)(?:\.(\d+))?$/u;

export const convertTokenValueToDecimal = (value: string | number, decimals: number) =>
    BigNumber(value).div(10 ** decimals);

export const parseBalanceAmount = (value: string) => {
    const regexGroups = value.match(BALANCE_PARSING_REGEX);
    const [_, currencySymbol, wholeNumberPart, decimalNumberPart] = regexGroups ?? [
        null,
        null,
        null,
    ];

    return {
        currencySymbol,
        wholeNumber: wholeNumberPart,
        decimalNumber: decimalNumberPart ? `.${decimalNumberPart}` : '',
    };
};
