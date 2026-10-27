import { useSelector } from 'react-redux';

import { type RateTypeWithoutHistoric } from '@suite-common/wallet-types';

import { useFiatRatesAfterDiscovery } from './useFiatRatesAfterDiscovery';
import { selectTickersFromDeviceAccounts } from '../fiatRatesSelectors';

type UseDeviceAccountsFiatRatesParams = {
    rateType?: RateTypeWithoutHistoric;
    isDisabled?: boolean;
    isPolling?: boolean;
    isDeferredDuringDiscovery?: boolean;
};

/**
 * Subscribes the component to the rates of the accounts of the selected device and their tokens.
 * Use it in views that show totals of the selected device, e.g. the portfolio.
 * Waits for discovery to finish, see `useFiatRatesAfterDiscovery`.
 */
export const useDeviceAccountsFiatRates = ({
    rateType = 'current',
    isDisabled,
    isPolling,
    isDeferredDuringDiscovery,
}: UseDeviceAccountsFiatRatesParams = {}) => {
    const tickers = useSelector(selectTickersFromDeviceAccounts);

    useFiatRatesAfterDiscovery({
        tickers,
        rateType,
        isDisabled,
        isPolling,
        isDeferredDuringDiscovery,
    });
};
