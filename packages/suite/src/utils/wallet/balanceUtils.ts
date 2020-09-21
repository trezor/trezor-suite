import BigNumber from 'bignumber.js';

export const formatCoinBalance = (value: string) => {
    const MAX_NUMBERS = 9;
    const MAX_CRYPTO_VALUE = '100000000';
    const balanceBig = new BigNumber(value);

    if (balanceBig.isZero() || balanceBig.isNaN()) return '0';
    if (balanceBig.isEqualTo(MAX_CRYPTO_VALUE)) return '100m';
    if (balanceBig.isGreaterThan(MAX_CRYPTO_VALUE)) return '100m+';

    // instead of splitting on input `value`, do it on "normalized" BN string (it strips leading zeros)
    const parts = balanceBig.abs().toFixed().split('.');
    const hasDecimals = parts.length > 1;

    if (hasDecimals) {
        const integerPartLength = parts[0].length || 1;
        const fractionalPartLength = parts[1].length;
        const fixCount = Math.max(MAX_NUMBERS - integerPartLength, 0); // don't go lower than 0
        const isTruncated = fractionalPartLength > fixCount;
        // fix to max visible numbers with decimals
        const fixedBalance = balanceBig.toFixed(fixCount, 1);
        const fixedBalanceBig = new BigNumber(fixedBalance);

        // indicate the dust
        const noDecimalsLeft = fixedBalanceBig.modulo(2).toFixed() === '0';
        if (noDecimalsLeft) {
            return fixedBalanceBig.toFixed(2);
        }

        return isTruncated ? `${fixedBalanceBig.toFixed()}…` : fixedBalanceBig.toFixed();
    }

    return balanceBig.toFixed();
};
