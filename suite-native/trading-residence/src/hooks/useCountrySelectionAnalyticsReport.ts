import { useCallback, useContext } from 'react';

import { type CountryChangeAction, events, injectNativeAnalytics } from '@suite-native/analytics';
import { useServices } from '@trezor/dependency-injection';

import { CountryChangeContextCheckContext } from '../components/CountryChangeContextCheckContext';

export const useCountrySelectionAnalyticsReport = () => {
    const type = useContext(CountryChangeContextCheckContext);
    const { analytics } = useServices(injectNativeAnalytics);

    return useCallback(
        (action: CountryChangeAction) => {
            analytics.report({
                type: events.tradingCountrySelectionEvent.name,
                payload: {
                    type,
                    action,
                },
            });
        },
        [analytics, type],
    );
};
