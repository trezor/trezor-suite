import { useSelector } from 'react-redux';

import { type EarnListRootState, selectEarnMissingTickerIds } from './earnDashboardSelectors';
import { useMissingRateTickersQuery } from '../fiat-rates/useMissingRateTickersQuery';
import { selectBaseCurrency } from '../settings/walletSettingsReducer';
import { useYieldOpportunities } from '../yield/hooks/useYieldOpportunities';

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
