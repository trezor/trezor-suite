import BigNumber from 'bignumber.js';

export const formatCoinBalance = (value: string) => {
    const MAX_NUMBERS = 8;
    const MAX_CRYPTO_VALUE = '100000000';
    const balanceBig = new BigNumber(value);

    if (balanceBig.isZero()) return '0';

    const parts = value.split('.');
    const hasDecimals = parts.length > 1;

    if (hasDecimals) {
        const fixed = balanceBig.toFixed(MAX_NUMBERS - parts[0].length || 1, 1);
        const fixedBalanceBig = new BigNumber(fixed);

        if (fixedBalanceBig.modulo(2).toFixed() === '0') {
            return fixedBalanceBig.toFixed(2);
        }

        return fixedBalanceBig.toString();
    }

    if (balanceBig.isGreaterThanOrEqualTo(MAX_CRYPTO_VALUE)) return '100m+';

    return balanceBig.toFixed();
};
