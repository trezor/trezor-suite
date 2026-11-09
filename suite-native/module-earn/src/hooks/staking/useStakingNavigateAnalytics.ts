import { useCallback } from 'react';

import { type StakingNavigateFrom } from '@suite-common/analytics';
import { type Account } from '@suite-common/wallet-types';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { useServices } from '@trezor/dependency-injection';

import { getStakingAnalyticsNavigateFrom } from '../../utils/staking/getStakingAnalyticsNavigateFrom';

export const useStakingNavigateAnalytics = () => {
    const { analytics } = useServices(injectNativeAnalytics);

    return useCallback(
        (account: Account, from?: StakingNavigateFrom) => {
            analytics.report({
                type: events.stakingNavigateEvent.name,
                payload: {
                    action: 'navigate',
                    from: from ?? getStakingAnalyticsNavigateFrom(account),
                    networkSymbol: account.symbol,
                },
            });
        },
        [analytics],
    );
};
