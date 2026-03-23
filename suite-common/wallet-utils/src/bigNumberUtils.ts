import { type BigNumber } from '@trezor/utils';

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
