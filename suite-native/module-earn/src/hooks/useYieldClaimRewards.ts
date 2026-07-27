import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    useExtendMerklRewardsWithFiat,
    useGetMerklRewards,
    useGetMerklRewardsQueryEntries,
} from '@suite-common/earn-stablecoin-api';
import {
    selectBaseCurrency,
    selectCurrentFiatRates,
    useMissingRateTickersQuery,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import {
    type StablecoinYieldAccountRewards,
    getStablecoinYieldAccountRewards,
} from '../utils/stablecoinYieldClaimSummaryUtils';

type UseYieldClaimRewardsParams = {
    account: Account | null;
};

export const useYieldClaimRewards = ({ account }: UseYieldClaimRewardsParams) => {
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const fiatCurrency = useSelector(selectBaseCurrency);
    const accounts = useMemo(() => (account ? [account] : []), [account]);
    const merklRewardsQueryEntries = useGetMerklRewardsQueryEntries(accounts, {
        skipEmptyAccountCheck: true,
    });

    const {
        data: chainsRewards,
        isLoading: isMerklRewardsLoading,
        refetch: refetchMerklRewards,
        waitForMerklToResolveClaim,
    } = useGetMerklRewards(merklRewardsQueryEntries);

    const { chainsRewardsWithFiat, missingRateTickers } = useExtendMerklRewardsWithFiat({
        chainsRewards,
        baseCurrency: fiatCurrency,
        currentFiatRates,
    });

    const missingRateTickersQuery = useMissingRateTickersQuery({
        missingRateTickers,
        baseCurrencyCode: fiatCurrency,
    });

    const accountRewards: StablecoinYieldAccountRewards | null = useMemo(() => {
        if (!account) {
            return null;
        }

        return getStablecoinYieldAccountRewards({
            account,
            chainsRewardsWithFiat,
        });
    }, [account, chainsRewardsWithFiat]);
    const waitForClaimRewardsToResolve = useCallback(async () => {
        try {
            await waitForMerklToResolveClaim();
        } finally {
            await refetchMerklRewards();
        }
    }, [refetchMerklRewards, waitForMerklToResolveClaim]);

    return useMemo(
        () => ({
            accountRewards,
            isClaimRewardsFiatLoading: missingRateTickersQuery.isLoading,
            isClaimRewardsLoading: merklRewardsQueryEntries.length > 0 && isMerklRewardsLoading,
            waitForMerklToResolveClaim: waitForClaimRewardsToResolve,
        }),
        [
            accountRewards,
            isMerklRewardsLoading,
            merklRewardsQueryEntries.length,
            missingRateTickersQuery.isLoading,
            waitForClaimRewardsToResolve,
        ],
    );
};
