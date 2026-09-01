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

import { type YieldClaimSummary } from '../types';
import {
    buildStablecoinYieldClaimSummaries,
    getTotalFiatClaimableAmount,
} from '../utils/stablecoinYieldClaimSummaryUtils';

export type StablecoinYieldClaimSummariesState = {
    stablecoinYieldClaimSummaries: YieldClaimSummary[];
    totalFiatClaimableAmount: BaseCurrencyAmount | null;
    isClaimSummariesLoading: boolean;
    isClaimSummariesFiatLoading: boolean;
    isClaimSummariesError: boolean;
    claimSummariesError: unknown;
};

type UseStablecoinYieldClaimSummariesProps = {
    accounts: Account[];
};

export const useStablecoinYieldClaimSummaries = ({
    accounts,
}: UseStablecoinYieldClaimSummariesProps): StablecoinYieldClaimSummariesState => {
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const fiatCurrency = useSelector(selectBaseCurrency);

    const merklRewardsQueryEntries = useGetMerklRewardsQueryEntries(accounts);

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
                accounts,
                chainsRewardsWithFiat,
            }),
        [accounts, chainsRewardsWithFiat],
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
