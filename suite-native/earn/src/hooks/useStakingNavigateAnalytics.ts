import { useCallback } from 'react';
import { useStore } from 'react-redux';

import { type StakingNavigateFrom } from '@suite-common/analytics';
import {
    type StakingAccountProductRootState,
    selectIsStakingAccountActive,
    selectStakingAccountProductDescriptor,
} from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { useServices } from '@trezor/dependency-injection';

import { getStakingAnalyticsNavigateFrom } from '../utils/getStakingAnalyticsNavigateFrom';

export const useStakingNavigateAnalytics = () => {
    const { analytics } = useServices(injectNativeAnalytics);
    const store = useStore<StakingAccountProductRootState>();

    return useCallback(
        (account: Account, from?: StakingNavigateFrom) => {
            analytics.report({
                type: events.stakingNavigateEvent.name,
                payload: {
                    action: 'navigate',
                    from:
                        from ??
                        getStakingAnalyticsNavigateFrom({
                            isStakingActive: selectIsStakingAccountActive(
                                store.getState(),
                                account.key,
                            ),
                            availableBalance: account.availableBalance,
                            minStakeAmount:
                                selectStakingAccountProductDescriptor(store.getState(), account.key)
                                    ?.limits.minStakeAmount ?? null,
                        }),
                    networkSymbol: account.symbol,
                },
            });
        },
        [analytics, store],
    );
};
