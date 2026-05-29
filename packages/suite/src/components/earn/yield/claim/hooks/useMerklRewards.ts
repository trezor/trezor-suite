import { useMemo } from 'react';

import { selectIsDebugModeActive } from '@suite/settings';
import {
    useExtendMerklRewardsWithFiat,
    useGetMerklRewards,
    useGetMerklRewardsQueryEntries,
    usePairRewardsWithAccounts,
    useTotalClaimableRewardsAmountOfAccounts,
} from '@suite-common/earn-stablecoin-api';
import { commonQueryKeys, useQuery } from '@suite-common/react-query';
import {
    selectBaseCurrency,
    selectCurrentFiatRates,
    updateFiatRatesThunk,
} from '@suite-common/wallet-core';
import { type Account, type Timestamp } from '@suite-common/wallet-types';

import { useDispatch, useSelector } from 'src/hooks/suite';

type YieldRewardsAccounts = (Account | undefined) | (Account | undefined)[];

/**
 * - Fetches Merkl rewards from provided chain/address query entries.
 * - Extends Merkl rewards with fiat rates (and fetches missing rate tickers).
 */
export function useMerklRewards(accounts: YieldRewardsAccounts) {
    const dispatch = useDispatch();

    const resolvedAccounts = useMemo<Account[]>(() => {
        const maybeAccounts = Array.isArray(accounts) ? accounts : [accounts];

        return maybeAccounts.filter((account): account is Account => Boolean(account));
    }, [accounts]);
    const isDebugMode = useSelector(selectIsDebugModeActive);
    const merklRewardsQueryEntries = useGetMerklRewardsQueryEntries(resolvedAccounts, isDebugMode);
    const merklRewardsQuery = useGetMerklRewards(merklRewardsQueryEntries);

    const baseCurrency = useSelector(selectBaseCurrency);
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const { chainsRewardsWithFiat, missingRateTickers } = useExtendMerklRewardsWithFiat({
        chainsRewards: merklRewardsQuery.data,
        baseCurrency,
        currentFiatRates,
    });
    const accountsRewards = usePairRewardsWithAccounts({
        chainsRewardsWithFiat,
        accounts: resolvedAccounts,
    });

    const missingRateTickersQuery = useQuery({
        queryKey: commonQueryKeys.missingRateTickers(missingRateTickers, baseCurrency),
        queryFn: () =>
            dispatch(
                updateFiatRatesThunk({
                    tickers: missingRateTickers,
                    baseCurrencyCode: baseCurrency,
                    rateType: 'current',
                    fetchAttemptTimestamp: Date.now() as Timestamp,
                    forceFetchToken: true,
                }),
            ).unwrap(),
        enabled: missingRateTickers.length > 0,
    });

    const totalRewardsToClaim = useTotalClaimableRewardsAmountOfAccounts(accountsRewards);

    return {
        merklRewardsQuery: {
            ...merklRewardsQuery,
            data: {
                accountsRewards,
                totalRewardsToClaim: {
                    value: totalRewardsToClaim,
                    currency: baseCurrency,
                },
            },
        },
        missingRateTickersQuery,
    };
}
