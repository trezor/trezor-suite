import { useSelector } from 'react-redux';

import { type UseFiatRatesParams, useFiatRates } from './useFiatRates';
import { type DiscoveryRootState } from '../../discovery/discoveryReducer';
import { selectHasAnyRunningDiscovery } from '../../discovery/discoverySelectors';

export type UseFiatRatesAfterDiscoveryParams = UseFiatRatesParams & {
    /** Off for components that show rates of accounts which are already discovered. */
    isDeferredDuringDiscovery?: boolean;
};

/**
 * Subscribes to the rates of account tickers like `useFiatRates`, but only once no discovery runs.
 * Discovery keeps adding accounts and tokens, and the totals are not shown until it finishes, so
 * fetching their rates meanwhile would only compete with discovery for the network.
 */
export const useFiatRatesAfterDiscovery = ({
    isDeferredDuringDiscovery = true,
    isDisabled = false,
    ...params
}: UseFiatRatesAfterDiscoveryParams) => {
    const hasAnyRunningDiscovery = useSelector((state: DiscoveryRootState) =>
        selectHasAnyRunningDiscovery(state),
    );

    return useFiatRates({
        ...params,
        isDisabled: isDisabled || (isDeferredDuringDiscovery && hasAnyRunningDiscovery),
    });
};
