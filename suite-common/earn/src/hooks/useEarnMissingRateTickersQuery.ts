import { useSelector } from 'react-redux';

import {
    selectBaseCurrency,
    useMissingRateTickersQuery,
    useYieldOpportunities,
} from '@suite-common/wallet-core';

import { type EarnRootState, selectEarnMissingTickerIds } from '../state/earnSelectors';

export const useEarnMissingRateTickersQuery = () => {
    const baseCurrency = useSelector(selectBaseCurrency);

    const { yieldOpportunities } = useYieldOpportunities();

    const missingEarnRateTickers = useSelector((state: EarnRootState) =>
        selectEarnMissingTickerIds(state, yieldOpportunities),
    );

    const missingRateTickersQuery = useMissingRateTickersQuery({
        missingRateTickers: missingEarnRateTickers,
        baseCurrencyCode: baseCurrency,
    });

    const isFiatRatesLoading = missingRateTickersQuery.isFetching;

    const onRetry = missingRateTickersQuery.refetch;

    return { isFiatRatesLoading, onRetry };
};
