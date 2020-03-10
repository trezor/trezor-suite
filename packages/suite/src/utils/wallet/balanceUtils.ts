import BigNumber from 'bignumber.js';

export const formatCoinBalance = (value: string) => {
    const MAX_NUMBERS = 8;
    const balanceBig = new BigNumber(value);

    if (balanceBig.isZero()) return '0';

    const parts = value.split('.');
    const hasDecimals = parts.length > 1;

    if (hasDecimals) {
        const DOT_CHAR_LENGTH = 1;
        const parts = value.split('.');
        return balanceBig.toFixed(MAX_NUMBERS - parts[0].length || 1 - DOT_CHAR_LENGTH, 1);
    }

    if (balanceBig.isGreaterThanOrEqualTo(100000000)) return '100M+';

    return balanceBig.toFixed();
};
