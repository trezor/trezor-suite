import { Locale } from '@suite-common/suite-types';
import { BigNumber, getLocaleSeparators } from '@trezor/utils';

export const localizeNumber = (
    value: number | string | BigNumber,
    locale: Locale = 'en-US',
    minDecimals = 0,
    maxDecimals?: number,
    groupFractionalPart = false,
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

    const localized = amount.toFormat(getDecimalsLength(), {
        decimalSeparator,
        groupSize,
        groupSeparator: thousandsSeparator,
    });

    if (!groupFractionalPart) {
        return localized;
    }

    const decimalIndex = localized.indexOf(decimalSeparator);
    if (decimalIndex === -1) {
        return localized;
    }

    const whole = localized.slice(0, decimalIndex);
    const fractional = localized.slice(decimalIndex + decimalSeparator.length);

    // Keep shorter fractions readable (e.g. 0.42, 0.0001). Add grouping only for long fractions.
    if (fractional.length <= 6) {
        return localized;
    }

    const groupedFractional = fractional.replace(/(\d{3})(?=\d)/g, `$1${thousandsSeparator}`);

    return `${whole}${decimalSeparator}${groupedFractional}`;
};
