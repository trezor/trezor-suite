import { useCallback } from 'react';

import { type Account } from '@suite-common/wallet-types';
import { events } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';

import { getStakingAnalyticsNavigateFrom } from '../utils/getStakingAnalyticsNavigateFrom';

export const useStakingNavigateAnalytics = () => {
    const analytics = useAnalytics();

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
