import { useMemo } from 'react';

import { selectIsDebugModeActive } from '@suite/debug';
import {
    useExtendMerklRewardsWithFiat,
    useGetMerklRewards,
    useGetMerklRewardsQueryEntries,
    usePairRewardsWithAccounts,
    useTotalClaimableRewardsAmountOfAccounts,
} from '@suite-common/earn-stablecoin-api';
import {
    selectBaseCurrency,
    selectCurrentFiatRates,
    useFiatRates,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';

type YieldRewardsAccounts = (Account | undefined) | (Account | undefined)[];

/**
 * - Fetches Merkl rewards from provided chain/address query entries.
 * - Extends Merkl rewards with fiat rates (and subscribes to the rates of the reward tokens).
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
    const { chainsRewardsWithFiat, rateTickers } = useExtendMerklRewardsWithFiat({
        chainsRewards: merklRewardsQuery.data,
        baseCurrency,
        currentFiatRates,
    });
    const accountsRewards = usePairRewardsWithAccounts({
        chainsRewardsWithFiat,
        accounts: resolvedAccounts,
    });

    const fiatRatesQuery = useFiatRates({
        tickers: rateTickers,
        baseCurrencyCode: baseCurrency,
        forceFetchToken: true,
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
        fiatRatesQuery,
    };
}
