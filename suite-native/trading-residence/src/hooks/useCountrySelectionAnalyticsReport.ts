import { useCallback, useContext } from 'react';

import type { CountryChangeAction } from '@suite-native/analytics';
import { EventType, analytics } from '@suite-native/analytics';

import { CountryChangeContextCheckContext } from '../components/CountryChangeContextCheckContext';

export const useCountrySelectionAnalyticsReport = () => {
    const type = useContext(CountryChangeContextCheckContext);

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
        [type],
    );
};
