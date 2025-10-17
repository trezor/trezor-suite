import { BigNumber } from '@trezor/utils/src/bigNumber';

/** Matches three groups: 1. currency symbol, 2. whole number part and 3. decimal part. */
const BALANCE_PARSING_REGEX = /^(\D+)([\d,]+)(?:\.(\d+))?$/u;

export const convertTokenValueToDecimal = (value: string | number, decimals: number) =>
    BigNumber(value).div(BigNumber(10).exponentiatedBy(decimals));

const normalizeValueForBtcAndSats = (value: string) => {
    // eslint-disable-next-line no-irregular-whitespace
    const [first, second] = value.split(/[ \s]/);

    if (!second) {
        return first;
    }

    return second.toLowerCase() === 'sat' || second.toLowerCase() === 'btc'
        ? `${second}${first}`
        : `${first}${second}`;
};

export const parseBalanceAmount = (value: string) => {
    const normalizedValue = normalizeValueForBtcAndSats(value);

    const regexGroups = normalizedValue.match(BALANCE_PARSING_REGEX);
    const [_, currencySymbol, wholeNumberPart, decimalNumberPart] = regexGroups ?? [
        null,
        null,
        null,
    ];

    return {
        currencySymbol: currencySymbol ? currencySymbol.trim() : null,
        wholeNumber: wholeNumberPart,
        decimalNumber: decimalNumberPart ? `.${decimalNumberPart}` : '',
    };
};
