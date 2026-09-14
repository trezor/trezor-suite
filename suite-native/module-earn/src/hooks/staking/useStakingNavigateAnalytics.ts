import { selectNetworkConfigDeps } from '@suite-common/networks';
import { useCallback } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { type Account } from '@suite-common/wallet-types';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';

import { getStakingAnalyticsNavigateFrom } from '../../utils/staking/getStakingAnalyticsNavigateFrom';

export const useStakingNavigateAnalytics = () => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const { analytics } = useServices(selectNativeAnalyticsDep);

    return useCallback(
        (account: Account) => {
            analytics.report({
                type: events.stakingNavigateEvent.name,
                payload: {
                    action: 'navigate',
                    from: getStakingAnalyticsNavigateFrom(networkConfigDeps, account),
                    networkSymbol: account.symbol,
                },
            });
        },
        [networkConfigDeps, analytics],
    );
};
