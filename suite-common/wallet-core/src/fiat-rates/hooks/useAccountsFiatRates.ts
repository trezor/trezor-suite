import { useSelector } from 'react-redux';

import { type RateTypeWithoutHistoric } from '@suite-common/wallet-types';

import { useFiatRates } from './useFiatRates';
import { selectTickerFromAccounts } from '../fiatRatesSelectors';

type UseAccountsFiatRatesParams = {
    rateType?: RateTypeWithoutHistoric;
    isDisabled?: boolean;
};

/**
 * Subscribes the component to the rates of all accounts and their tokens. Use it in views that show
 * totals across accounts, e.g. the portfolio.
 */
export const useAccountsFiatRates = ({
    rateType = 'current',
    isDisabled,
}: UseAccountsFiatRatesParams = {}) => {
    const tickers = useSelector(selectTickerFromAccounts);

    useFiatRates({ tickers, rateType, isDisabled });
};
