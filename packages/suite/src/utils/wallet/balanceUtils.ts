import BigNumber from 'bignumber.js';

export const formatCoinBalance = (value: string) => {
    const MAX_NUMBERS = 8;
    const MAX_CRYPTO_VALUE = '100000000';
    const balanceBig = new BigNumber(value);

    if (balanceBig.isZero()) return '0';

    const parts = value.split('.');
    const hasDecimals = parts.length > 1;

    if (hasDecimals) {
        const firstPart = parts[0].length || 1;
        const fixCount = MAX_NUMBERS - firstPart;
        // fix to max visible numbers with decimals
        const fixedBalance = balanceBig.toFixed(fixCount, 1);
        const fixedBalanceBig = new BigNumber(fixedBalance);

        // indicate the dust
        const noDecimalsLeft = fixedBalanceBig.modulo(2).toFixed() === '0';
        if (noDecimalsLeft) {
            return fixedBalanceBig.toFixed(2);
        }

        return fixedBalanceBig.toString();
    }

    if (balanceBig.isGreaterThanOrEqualTo(MAX_CRYPTO_VALUE)) return '100m+';

    return balanceBig.toFixed();
};
