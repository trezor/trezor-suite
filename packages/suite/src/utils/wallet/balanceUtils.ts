import BigNumber from 'bignumber.js';

export const formatCoinBalance = (value: string) => {
    const MAX_NUMBERS = 8;
    const MAX_CRYPTO_VALUE = '100000000';
    const balanceBig = new BigNumber(value);

    if (balanceBig.isZero()) return '0';

    const parts = value.split('.');
    const hasDecimals = parts.length > 1;

    if (hasDecimals) {
        const DOT_CHAR_LENGTH = 1;
        const fixed = balanceBig.toFixed(MAX_NUMBERS - parts[0].length || 1 - DOT_CHAR_LENGTH, 1);
        const fixedBalance = new BigNumber(fixed).toString();

        if (new BigNumber(fixedBalance).modulo(2).toFixed() === '0') {
            return new BigNumber(fixed).toFixed(2);
        }

        return fixedBalance;
    }

    if (balanceBig.isGreaterThanOrEqualTo(MAX_CRYPTO_VALUE)) return '100m+';

    return balanceBig.toFixed();
};
