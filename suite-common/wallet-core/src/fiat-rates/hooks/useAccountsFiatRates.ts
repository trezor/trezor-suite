import { useSelector } from 'react-redux';

import { type RateTypeWithoutHistoric } from '@suite-common/wallet-types';

import { useFiatRates } from './useFiatRates';
import { selectTickerFromAccounts } from '../fiatRatesSelectors';

type UseAccountsFiatRatesParams = {
    rateType?: RateTypeWithoutHistoric;
    isDisabled?: boolean;
    isPolling?: boolean;
};

/**
 * Subscribes the component to the rates of the accounts of all remembered devices and their tokens.
 * Use it in views that show totals across devices, e.g. the device switcher.
 */
export const useAccountsFiatRates = ({
    rateType = 'current',
    isDisabled,
    isPolling,
}: UseAccountsFiatRatesParams = {}) => {
    const tickers = useSelector(selectTickerFromAccounts);

    useFiatRates({ tickers, rateType, isDisabled, isPolling });
};
