import { useSelector } from 'react-redux';

import { type RateTypeWithoutHistoric } from '@suite-common/wallet-types';

import { useFiatRatesAfterDiscovery } from './useFiatRatesAfterDiscovery';
import { selectTickerFromAccounts } from '../fiatRatesSelectors';

type UseAccountsFiatRatesParams = {
    rateType?: RateTypeWithoutHistoric;
    isDisabled?: boolean;
    isPolling?: boolean;
    isDeferredDuringDiscovery?: boolean;
};

/**
 * Subscribes the component to the rates of the accounts of all remembered devices and their tokens.
 * Use it in views that show totals across devices, e.g. the device switcher.
 * Waits for discovery to finish, see `useFiatRatesAfterDiscovery`.
 */
export const useAccountsFiatRates = ({
    rateType = 'current',
    isDisabled,
    isPolling,
    isDeferredDuringDiscovery,
}: UseAccountsFiatRatesParams = {}) => {
    const tickers = useSelector(selectTickerFromAccounts);

    useFiatRatesAfterDiscovery({
        tickers,
        rateType,
        isDisabled,
        isPolling,
        isDeferredDuringDiscovery,
    });
};
