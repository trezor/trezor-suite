import { type Locale } from '@suite-common/suite-types';
import { formatCoinBalance, localizeNumber } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { CRYPTO_BALANCE_DECIMALS } from '../constants';
import { type EarnDepositsCardActiveItem } from '../types';

type FormatEarnAmountParams = {
    amount: string;
    locale: Locale;
    /** Precision of the amount's token, so a computed estimate can't show digits it has no room for. */
    maxDecimals?: number;
};

type FormatEarnTokenAmountParams = FormatEarnAmountParams & {
    symbol: string;
};

// formatCoinBalance rounds amounts below this threshold away to "0.00".
const COIN_BALANCE_DUST_THRESHOLD = new BigNumber('1e-8');

/**
 * Formats an amount without its symbol, for callers rendering the symbol as a separate element.
 */
export const formatEarnAmount = ({ amount, locale, maxDecimals }: FormatEarnAmountParams) => {
    // A fixed decimal cap would round dust-sized deposited and received amounts away to zero.
    const amountBig = new BigNumber(amount);
    const isBelowCoinBalancePrecision =
        !amountBig.isZero() && amountBig.abs().lt(COIN_BALANCE_DUST_THRESHOLD);

    return isBelowCoinBalancePrecision
        ? localizeNumber(amount, locale, 0, maxDecimals)
        : formatCoinBalance(amount, locale);
};

export const formatEarnTokenAmount = ({ amount, locale, symbol }: FormatEarnTokenAmountParams) =>
    `${formatEarnAmount({ amount, locale })} ${symbol}`;

type FormatEarnActiveItemBalanceParams = {
    item: EarnDepositsCardActiveItem;
    locale: Locale;
};

export const formatEarnActiveItemBalance = ({
    item,
    locale,
}: FormatEarnActiveItemBalanceParams) => {
    if (item.type === 'staking') {
        const balance = localizeNumber(item.balance, locale, 0, CRYPTO_BALANCE_DECIMALS);

        return `${balance} ${item.symbol.toUpperCase()}`;
    }

    return formatEarnTokenAmount({ amount: item.balance, locale, symbol: item.tokenSymbol });
};
