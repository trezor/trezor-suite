import { useSelector } from 'react-redux';

import { selectBaseCurrency, useMissingRateTickersQuery } from '@suite-common/wallet-core';

import { type EarnListRootState, selectEarnMissingTickerIds } from '../../earnScreenSelectors';
import { useYieldOpportunities } from '../yield/useYieldOpportunities';

export const useEarnMissingRateTickersQuery = () => {
    const baseCurrency = useSelector(selectBaseCurrency);

    const { yieldOpportunities } = useYieldOpportunities();

    const missingEarnRateTickers = useSelector((state: EarnListRootState) =>
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
