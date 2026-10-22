import { useSelector } from 'react-redux';

import { type RateTypeWithoutHistoric } from '@suite-common/wallet-types';

import { useFiatRates } from './useFiatRates';
import { selectTickersFromDeviceAccounts } from '../fiatRatesSelectors';

type UseDeviceAccountsFiatRatesParams = {
    rateType?: RateTypeWithoutHistoric;
    isDisabled?: boolean;
    isPolling?: boolean;
};

/**
 * Subscribes the component to the rates of the accounts of the selected device and their tokens.
 * Use it in views that show totals of the selected device, e.g. the portfolio.
 */
export const useDeviceAccountsFiatRates = ({
    rateType = 'current',
    isDisabled,
    isPolling,
}: UseDeviceAccountsFiatRatesParams = {}) => {
    const tickers = useSelector(selectTickersFromDeviceAccounts);

    useFiatRates({ tickers, rateType, isDisabled, isPolling });
};
