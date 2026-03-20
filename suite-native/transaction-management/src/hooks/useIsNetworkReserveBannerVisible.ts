import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectIsNetworkReserveEnabled } from '@suite-common/wallet-core';
import { getNetworkReserve } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

type UseIsNetworkReserveBannerVisibleParams = {
    symbol?: NetworkSymbol | null;
    contractAddress?: string | null;
    amount?: string | null;
    balance?: string | null;
    maxAmount?: string | null;
};

export const useIsNetworkReserveBannerVisible = ({
    symbol,
    contractAddress,
    amount,
    balance,
    maxAmount,
}: UseIsNetworkReserveBannerVisibleParams): boolean => {
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);

    if (!symbol) return false;

    const networkReserve = getNetworkReserve({
        symbol,
        contractAddress,
        isEnabled: isNetworkReserveEnabled,
    });

    if (!networkReserve || !amount || !balance) return false;

    // Same logic as sendOutputsFormSchema: feeWithReserve = balance - maxAmount.
    // For Trading (no maxAmount), feeWithReserve = networkReserve.
    const feeWithReserve = maxAmount
        ? new BigNumber(balance).minus(maxAmount).toString()
        : networkReserve;

    const amountBN = new BigNumber(amount);
    // Banner shows when amount reaches the reserve zone (>= balance - feeWithReserve)
    // but does not exceed the total balance.
    const threshold = new BigNumber(balance).minus(feeWithReserve);

    return amountBN.gte(threshold) && amountBN.gt(0) && amountBN.lte(balance);
};
