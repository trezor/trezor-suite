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
    useFiatRates,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import {
    type StablecoinYieldAccountRewards,
    getStablecoinYieldAccountRewards,
} from '../../utils/yield/stablecoinYieldClaimSummaryUtils';

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

    const { chainsRewardsWithFiat, rateTickers } = useExtendMerklRewardsWithFiat({
        chainsRewards,
        baseCurrency: fiatCurrency,
        currentFiatRates,
    });

    const fiatRatesQuery = useFiatRates({
        tickers: rateTickers,
        baseCurrencyCode: fiatCurrency,
        forceFetchToken: true,
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
            isClaimRewardsFiatLoading: fiatRatesQuery.isLoading,
            isClaimRewardsLoading: merklRewardsQueryEntries.length > 0 && isMerklRewardsLoading,
            waitForMerklToResolveClaim: waitForClaimRewardsToResolve,
        }),
        [
            accountRewards,
            isMerklRewardsLoading,
            merklRewardsQueryEntries.length,
            fiatRatesQuery.isLoading,
            waitForClaimRewardsToResolve,
        ],
    );
};
