import { useMemo } from 'react';

import { selectIsDebugModeActive } from '@suite/debug';
import {
    useExtendMerklRewardsWithFiat,
    useGetMerklRewards,
    useGetMerklRewardsQueryEntries,
    usePairRewardsWithAccounts,
    useTotalClaimableRewardsAmountOfAccounts,
} from '@suite-common/earn-stablecoin-api';
import { useSelector } from '@suite-common/redux-utils';
import {
    selectBaseCurrency,
    selectCurrentFiatRates,
    useMissingRateTickersQuery,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
type YieldRewardsAccounts = (Account | undefined) | (Account | undefined)[];

/**
 * - Fetches Merkl rewards from provided chain/address query entries.
 * - Extends Merkl rewards with fiat rates (and fetches missing rate tickers).
 */
export function useMerklRewards(accounts: YieldRewardsAccounts) {
    const resolvedAccounts = useMemo<Account[]>(() => {
        const maybeAccounts = Array.isArray(accounts) ? accounts : [accounts];

        return maybeAccounts.filter((account): account is Account => Boolean(account));
    }, [accounts]);
    const isDebugMode = useSelector(selectIsDebugModeActive);
    const merklRewardsQueryEntries = useGetMerklRewardsQueryEntries(resolvedAccounts, {
        isDebugMode,
    });
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

    const missingRateTickersQuery = useMissingRateTickersQuery({
        missingRateTickers,
        baseCurrencyCode: baseCurrency,
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
