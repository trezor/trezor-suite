import { useMemo } from 'react';
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
import { type Account, type BaseCurrencyAmount } from '@suite-common/wallet-types';

import { type StablecoinYieldClaimSummary, type StablecoinYieldEarnItem } from '../types';
import {
    buildStablecoinYieldClaimSummaries,
    getActiveStablecoinYieldClaimAccounts,
    getTotalFiatClaimableAmount,
} from '../utils/stablecoinYieldClaimSummaryUtils';

export type StablecoinYieldClaimSummariesState = {
    stablecoinYieldClaimSummaries: StablecoinYieldClaimSummary[];
    totalFiatClaimableAmount: BaseCurrencyAmount | null;
    isClaimSummariesLoading: boolean;
    isClaimSummariesFiatLoading: boolean;
    isClaimSummariesError: boolean;
    claimSummariesError: unknown;
};

type UseStablecoinYieldClaimSummariesProps = {
    activeItems: StablecoinYieldEarnItem[];
    accounts: Account[];
};

export const useStablecoinYieldClaimSummaries = ({
    activeItems,
    accounts,
}: UseStablecoinYieldClaimSummariesProps): StablecoinYieldClaimSummariesState => {
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const fiatCurrency = useSelector(selectBaseCurrency);

    const activeClaimAccounts = useMemo(
        () =>
            getActiveStablecoinYieldClaimAccounts({
                activeItems,
                accounts,
            }),
        [accounts, activeItems],
    );

    const merklRewardsQueryEntries = useGetMerklRewardsQueryEntries(activeClaimAccounts, {
        skipEmptyAccountCheck: true,
    });

    const {
        data: chainsRewards,
        error: merklRewardsError,
        isError: isMerklRewardsError,
        isLoading: isMerklRewardsLoading,
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

    const stablecoinYieldClaimSummaries = useMemo(
        () =>
            buildStablecoinYieldClaimSummaries({
                activeAccounts: activeClaimAccounts,
                chainsRewardsWithFiat,
            }),
        [activeClaimAccounts, chainsRewardsWithFiat],
    );
    const totalFiatClaimableAmount = useMemo(
        () => getTotalFiatClaimableAmount(stablecoinYieldClaimSummaries),
        [stablecoinYieldClaimSummaries],
    );

    return useMemo(
        () => ({
            stablecoinYieldClaimSummaries,
            totalFiatClaimableAmount,
            isClaimSummariesLoading: merklRewardsQueryEntries.length > 0 && isMerklRewardsLoading,
            isClaimSummariesFiatLoading: missingRateTickersQuery.isLoading,
            isClaimSummariesError: isMerklRewardsError,
            claimSummariesError: merklRewardsError,
        }),
        [
            isMerklRewardsError,
            isMerklRewardsLoading,
            merklRewardsError,
            merklRewardsQueryEntries.length,
            missingRateTickersQuery.isLoading,
            stablecoinYieldClaimSummaries,
            totalFiatClaimableAmount,
        ],
    );
};
