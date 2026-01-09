import { useCallback, useContext } from 'react';

import { CountryChangeAction, EventType } from '@suite-native/analytics';
import { useLegacyAnalytics } from '@suite-native/services';

import { CountryChangeContextCheckContext } from '../components/CountryChangeContextCheckContext';

export const useCountrySelectionAnalyticsReport = () => {
    const type = useContext(CountryChangeContextCheckContext);
    const legacyAnalytics = useLegacyAnalytics();

    return useCallback(
        (action: CountryChangeAction) => {
            legacyAnalytics.report({
                type: EventType.TradingCountrySelection,
                payload: {
                    type,
                    action,
                },
            });
        },
        [legacyAnalytics, type],
    );
};
