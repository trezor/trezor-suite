import { useCallback, useContext } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { type CountryChangeAction, type NativeAnalyticsDep, events } from '@suite-native/analytics';

import { CountryChangeContextCheckContext } from '../components/CountryChangeContextCheckContext';

export const useCountrySelectionAnalyticsReport = () => {
    const type = useContext(CountryChangeContextCheckContext);
    const { analytics } = useServices<NativeAnalyticsDep>();

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
