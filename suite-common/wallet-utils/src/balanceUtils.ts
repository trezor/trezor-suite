import { type Locale } from '@suite-common/suite-types';
import { BigNumber } from '@trezor/utils';

import { localizeNumber } from './localizeNumberUtils';

export const isZero = (value: string) => {
    const valueBig = new BigNumber(value);

    return valueBig.isZero();
};

export const isPositiveBalance = (value: string) => new BigNumber(value).isGreaterThan(0);

export const formatCoinBalance = (value: string, locale: Locale = 'en-US') => {
    const MAX_NUMBERS = 9;
    const balanceBig = new BigNumber(value);

    if (balanceBig.isZero() || balanceBig.isNaN()) return '0';

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
            return localizeNumber(fixedBalanceBig, locale, 2);
        }

        const localizedBalance = localizeNumber(fixedBalanceBig, locale);

        return isTruncated ? `${localizedBalance}` : localizedBalance;
    }

    return localizeNumber(balanceBig, locale);
};

// Targets a smallest displayed unit of ≈ $1: decimals = ceil(log10(fiatRate)).
// BTC @ $60k → 5 decimals (0.00001 BTC ≈ $0.60); DOGE @ $0.10 → 0 decimals.
export const formatCoinBalanceByFiatRate = (
    value: string,
    locale: Locale = 'en-US',
    fiatRate?: number,
) => {
    const balanceBig = new BigNumber(value);

    if (balanceBig.isZero() || balanceBig.isNaN()) return '0';

    if (fiatRate === undefined || !Number.isFinite(fiatRate) || fiatRate <= 0) {
        return formatCoinBalance(value, locale);
    }

    const decimals = Math.max(0, Math.ceil(Math.log10(fiatRate)));

    const parts = balanceBig.abs().toFixed().split('.');
    const fractionalLength = parts.length > 1 ? parts[1].length : 0;
    const isTruncated = fractionalLength > decimals;

    const fixedBalance = balanceBig.toFixed(decimals, 1); // ROUND_DOWN
    const fixedBalanceBig = new BigNumber(fixedBalance);

    // Non-zero original got truncated to zero — surface a dust hint instead of "0"
    if (fixedBalanceBig.isZero() && balanceBig.isGreaterThan(0)) {
        return decimals > 0 ? `< 0.${'0'.repeat(decimals - 1)}1` : '< 1';
    }

    const localizedBalance = localizeNumber(fixedBalanceBig, locale);

    return isTruncated ? `${localizedBalance}` : localizedBalance;
};
