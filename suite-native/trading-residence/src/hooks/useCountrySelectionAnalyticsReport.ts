import { useCallback, useContext } from 'react';

import { CountryChangeAction, EventType, useLegacyAnalytics } from '@suite-native/analytics';

import { CountryChangeContextCheckContext } from '../components/CountryChangeContextCheckContext';

export const useCountrySelectionAnalyticsReport = () => {
    const type = useContext(CountryChangeContextCheckContext);
    const legacyAnalytics = useLegacyAnalytics();

    return useCallback(
        (action: CountryChangeAction) => {
            // @TODO is it case for getTypedNativeLegacyAnalytics?
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
