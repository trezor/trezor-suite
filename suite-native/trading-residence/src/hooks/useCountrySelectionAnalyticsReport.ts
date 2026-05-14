import { useCallback, useContext } from 'react';

import { type CountryChangeAction, events } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';

import { CountryChangeContextCheckContext } from '../components/CountryChangeContextCheckContext';

export const useCountrySelectionAnalyticsReport = () => {
    const type = useContext(CountryChangeContextCheckContext);
    const analytics = useAnalytics();

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
