import { BigNumber, type BigNumberValue } from './bigNumber';

type FormatBigUintToLEParams = {
    /** The value to format, must be non-negative and an integer. */
    value: BigNumberValue;
    /** The byte length of the output string. */
    bytesLength: number;
};

/**
 * Formats an unsigned integer to a little-endian hex string of a given byte length.
 * @returns A little-endian hex string.
 * @throws {Error} If the value is negative, not an integer, or exceeds the specified byte length.
 */
export const formatBigUintToLE = ({ value, bytesLength }: FormatBigUintToLEParams): string => {
    if (typeof value === 'number' && !Number.isSafeInteger(value)) {
        throw new Error('Number value must be a safe integer; pass a string for larger values');
    }

    const bn = new BigNumber(value);

    if (bn.isNegative()) {
        throw new Error('Value cannot be negative');
    }

    if (!bn.isInteger()) {
        throw new Error('Value must be an integer');
    }

    if (!Number.isSafeInteger(bytesLength) || bytesLength <= 0) {
        throw new Error('Byte length must be a positive safe integer');
    }

    const paddingLength = bytesLength * 2;
    let hexString = bn.toString(16);

    if (hexString.length > paddingLength) {
        throw new Error(`Exceeds ${bytesLength} bytes`);
    }

    hexString = hexString.padStart(paddingLength, '0');
    const bytes = new Uint8Array(bytesLength);

    for (let i = 0; i < bytesLength; i++) {
        bytes[i] = parseInt(hexString.substring(i * 2, i * 2 + 2), 16);
    }

    return Buffer.from(bytes.reverse()).toString('hex');
};
