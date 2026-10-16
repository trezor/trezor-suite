import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getUniqueTickers, selectBaseCurrency, useFiatRates } from '@suite-common/wallet-core';

import {
    type EarnListRootState,
    selectStakingFiatPositions,
    selectYieldFiatPositions,
} from '../../earnScreenSelectors';
import { useYieldOpportunities } from '../yield/useYieldOpportunities';

export const useEarnMissingRateTickersQuery = () => {
    const baseCurrency = useSelector(selectBaseCurrency);

    const { yieldOpportunities } = useYieldOpportunities();

    const stakingFiatPositions = useSelector(selectStakingFiatPositions);
    const yieldFiatPositions = useSelector((state: EarnListRootState) =>
        selectYieldFiatPositions(state, yieldOpportunities),
    );

    // Subscribes to the rates of all earn positions, not only the missing ones, so that a rate
    // stays subscribed and fresh once it arrives.
    const earnTickers = useMemo(
        () =>
            getUniqueTickers(
                [...stakingFiatPositions, ...yieldFiatPositions].map(({ tickerId }) => tickerId),
            ),
        [stakingFiatPositions, yieldFiatPositions],
    );

    const fiatRatesQuery = useFiatRates({
        tickers: earnTickers,
        baseCurrencyCode: baseCurrency,
        forceFetchToken: true,
    });

    // Rates fetched for the first time (or again after a failure) count as loading, background
    // polling of rates already shown does not.
    const isFiatRatesLoading = fiatRatesQuery.isLoading;

    const onRetry = fiatRatesQuery.refetch;

    return { isFiatRatesLoading, onRetry };
};
