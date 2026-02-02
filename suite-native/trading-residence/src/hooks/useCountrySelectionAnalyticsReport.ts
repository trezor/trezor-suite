import { useCallback, useContext } from 'react';

import { CountryChangeAction, EventType } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';

import { CountryChangeContextCheckContext } from '../components/CountryChangeContextCheckContext';

export const useCountrySelectionAnalyticsReport = () => {
    const type = useContext(CountryChangeContextCheckContext);
    const analytics = useAnalytics();

    return useCallback(
        (action: CountryChangeAction) => {
            analytics.report({
                type: EventType.TradingCountrySelection,
                payload: {
                    type,
                    action,
                },
            });
        },
        [analytics, type],
    );
};
