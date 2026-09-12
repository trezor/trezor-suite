import { type Locale } from '@suite-common/suite-types';
import { BigNumber, getLocaleSeparators } from '@trezor/utils';

export const localizeNumber = (
    value: number | string | BigNumber,
    locale: Locale = 'en-US',
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

    // Truncated, never rounded up: a balance must not read as more than is held.
    const truncatedAmount =
        maxDecimals !== undefined
            ? amount.decimalPlaces(maxDecimals, BigNumber.ROUND_DOWN)
            : amount;

    const getDecimalsLength = () => {
        const decimalsLength = truncatedAmount.decimalPlaces() ?? 0;

        return decimalsLength < minDecimals ? minDecimals : decimalsLength;
    };

    // In some locales (e.g. Spanish), thousands separator may not be used when the number has four digits.
    // Respect the way Intl formats the numbers.
    const groupSize =
        truncatedAmount.lt(10000) &&
        truncatedAmount.gte(1000) &&
        !Intl.NumberFormat(locale).format(truncatedAmount.toNumber()).includes(thousandsSeparator)
            ? 4
            : 3;

    return truncatedAmount.toFormat(getDecimalsLength(), {
        decimalSeparator,
        groupSize,
        groupSeparator: thousandsSeparator,
    });
};
