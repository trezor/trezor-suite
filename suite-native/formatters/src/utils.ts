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

export const formatNumberWithThousandCommas = (
    value: number | string | BigNumber,
    minDecimals = 0,
    maxDecimals?: number,
) => {
    if (maxDecimals !== undefined && maxDecimals < minDecimals) {
        throw Error(
            `maxDecimals (${maxDecimals}) cannot be lower than minDecimals (${minDecimals})`,
        );
    }

    const amount = new BigNumber(value);

    const getDecimalsLength = () => {
        const originalDecimalsLegth = amount.decimalPlaces() ?? 0;
        if (originalDecimalsLegth < minDecimals) {
            return minDecimals;
        }
        if (maxDecimals !== undefined && originalDecimalsLegth > maxDecimals) {
            // Remove trailing zeroes after formatting:
            return new BigNumber(amount.toFixed(maxDecimals)).decimalPlaces() ?? maxDecimals;
        }

        return originalDecimalsLegth;
    };

    return amount.toFormat(getDecimalsLength(), {
        decimalSeparator: '.',
        groupSize: 3,
        groupSeparator: ',',
    });
};
