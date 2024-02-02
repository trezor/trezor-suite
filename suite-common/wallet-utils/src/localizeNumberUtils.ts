import BigNumber from 'bignumber.js';

import { getLocaleSeparators } from '@trezor/utils';

export const localizeNumber = (
    value: number | string | BigNumber,
    locale = 'en',
    minDecimals = 0,
    maxDecimals?: number,
) => {
    if (maxDecimals !== undefined && maxDecimals < minDecimals) {
        throw Error(
            `maxDecimals (${maxDecimals}) cannot be lower than minDecimals (${minDecimals})`,
        );
    }

    const amount = new BigNumber(value);

    if (amount.isNaN() || !amount.isFinite()) {
        return '';
    }

    const { decimalSeparator, thousandsSeparator } = getLocaleSeparators(locale);

    const getDecimalsLength = () => {
        const originalDecimalsLength = amount.decimalPlaces() ?? 0;
        if (originalDecimalsLength < minDecimals) {
            return minDecimals;
        }
        if (maxDecimals !== undefined && originalDecimalsLength > maxDecimals) {
            // Remove trailing zeroes after formatting:
            return new BigNumber(amount.toFixed(maxDecimals)).decimalPlaces() ?? maxDecimals;
        }
        return originalDecimalsLength;
    };

    // In some locales (e.g. Spanish), thousands separator may not be used when the number has four digits.
    // Respect the way Intl formats the numbers.
    const groupSize =
        amount.lt(10000) &&
        amount.gte(1000) &&
        !Intl.NumberFormat(locale).format(amount.toNumber()).includes(thousandsSeparator)
            ? 4
            : 3;

    return amount.toFormat(getDecimalsLength(), {
        decimalSeparator,
        groupSize,
        groupSeparator: thousandsSeparator,
    });
};
