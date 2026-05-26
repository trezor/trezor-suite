import { UINT256_MAX } from '@suite-common/suite-constants';
import { BigNumber } from '@trezor/utils';

/**
 * Rounds a value to a given number of non-zero fractional digits.
 * @example
 * roundToNonZeroFractionDigits(new BigNumber('0.000000012367'), 4) // 0.0001237
 * roundToNonZeroFractionDigits(new BigNumber('1.23456789'), 4) // 1.2346
 * roundToNonZeroFractionDigits(new BigNumber('1.23400000'), 4) // 1.234
 * roundToNonZeroFractionDigits(new BigNumber('1.00000000'), 4) // 1
 */
export function roundToNonZeroFractionDigits(
    value: BigNumber,
    nonZeroFractionDigits: number,
): BigNumber {
    if (value.isZero()) {
        return value;
    }

    // Get the fractional part as a string without scientific notation
    const [, fractionDigits = ''] = value.toString().split('.');

    // Find index (1-based) of the 4th non-zero digit after the decimal point
    let nonZeroDigits = 0;
    // Decimal places we'll round to
    let decimalPlaces = 0;

    for (let i = 0; i < fractionDigits.length; i++) {
        if (fractionDigits[i] !== '0') nonZeroDigits++;

        if (nonZeroDigits === nonZeroFractionDigits) {
            decimalPlaces = i + 1;
            break;
        }
    }

    // If the number has < nonZeroFractionDigits non-zero fractional digits leave it as is
    if (nonZeroDigits < nonZeroFractionDigits) {
        return value;
    }

    // Round *up* at the calculated decimal place
    return value.decimalPlaces(decimalPlaces);
}

/** Whether {@link value} equals EVM unlimited token allowance. */
export const isMaxAllowance = (value: string | undefined): boolean => {
    if (!value) {
        return false;
    }

    const allowance = new BigNumber(value);
    const maxAllowance = new BigNumber(UINT256_MAX).dividedBy(2).integerValue();

    // Some callers pass the raw allowance value in base units.
    if (allowance.gte(maxAllowance)) {
        return true;
    }

    const [, fractionalPart] = value.split('.');

    if (!fractionalPart) {
        return false;
    }

    // Some DEX quote fields pass the same value formatted with token decimals.
    return allowance.shiftedBy(fractionalPart.length).gte(maxAllowance);
};
