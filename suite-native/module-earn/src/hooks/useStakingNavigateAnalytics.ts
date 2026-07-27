import { useCallback } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { type Account } from '@suite-common/wallet-types';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';

import { getStakingAnalyticsNavigateFrom } from '../utils/getStakingAnalyticsNavigateFrom';

export const useStakingNavigateAnalytics = () => {
    const { analytics } = useServices(selectNativeAnalyticsDep);

    return useCallback(
        (account: Account) => {
            analytics.report({
                type: events.stakingNavigateEvent.name,
                payload: {
                    action: 'navigate',
                    from: getStakingAnalyticsNavigateFrom(account),
                    networkSymbol: account.symbol,
                },
            });
        },
        [analytics],
    );
};
