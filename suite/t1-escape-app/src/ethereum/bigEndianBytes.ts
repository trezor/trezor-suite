/**
 * Encodes an unsigned integer the way the legacy signing message carries it: big-endian bytes
 * without leading zero bytes, as hex, and nothing at all for zero.
 */
export const toBigEndianHex = (value: bigint | number): string => {
    const big = BigInt(value);
    if (big < 0n) throw new RangeError('negative numbers have no big-endian byte form');
    if (big === 0n) return '';

    const hex = big.toString(16);

    return hex.length % 2 === 0 ? hex : `0${hex}`;
};
