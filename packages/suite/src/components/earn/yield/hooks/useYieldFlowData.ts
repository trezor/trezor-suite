import { useMemo } from 'react';

import { useSelector } from '@suite-common/redux-utils';
import {
    type GetResolvedYieldFlowDataProps,
    type ResolvedYieldFlowData,
    getResolvedYieldFlowData,
    selectBaseCurrency,
    useMissingRateTickersQuery,
} from '@suite-common/wallet-core';
import { type TickerId, toTokenAddress } from '@suite-common/wallet-types';
export const useYieldFlowData = ({
    account,
    vault,
    tokenContract,
}: GetResolvedYieldFlowDataProps): ResolvedYieldFlowData => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);

    const yieldFlowData = useMemo(
        () => getResolvedYieldFlowData({ account, vault, tokenContract }),
        [account, vault, tokenContract],
    );

    const { token } = yieldFlowData;

    const missingRateTickers = useMemo(() => {
        if (!token?.contractAddress) return [];

        const tickerId = {
            symbol: token.networkSymbol,
            tokenAddress: toTokenAddress(token.contractAddress),
        } satisfies TickerId;

        return [tickerId];
    }, [token]);

    // The deposited token (e.g. WETH) is often not held by the user, so the balance-driven fiat
    // rate fetch skips it. Force-fetch the token's rate so the approximate fiat value can render.
    useMissingRateTickersQuery({ baseCurrencyCode, missingRateTickers });

    return yieldFlowData;
};
