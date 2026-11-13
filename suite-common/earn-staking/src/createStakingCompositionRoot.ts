import type { StakingPlatform, StakingProductAdapter } from '@suite-common/earn-staking-common';
import type { Dispatch } from '@trezor/redux-utils';

import type { StakingDeviceAccess } from './createStakingDeviceAccess';
import { type StakingSchedulerDeps, createStakingScheduler } from './createStakingScheduler';
import { createStakingProductRepository } from './repository/createStakingProductRepository';
import type { StakingServices } from './stakingServices';
import { stakingActions } from './state/stakingReducer';
import {
    refreshStakingProductInfoThunk,
    revalidateStakingPositionsThunk,
} from './state/stakingThunks';

export type StakingCompositionRootDeps = Pick<
    StakingSchedulerDeps,
    'now' | 'timers' | 'subscribeToForeground'
> & {
    platform: StakingPlatform;
    adapters: readonly StakingProductAdapter[];
    deviceAccess: StakingDeviceAccess;
    dispatch: Dispatch;
};

export const createStakingCompositionRoot = (deps: StakingCompositionRootDeps): StakingServices => {
    const stakingProductRepository = createStakingProductRepository({ adapters: deps.adapters });

    const stakingScheduler = createStakingScheduler({
        refresh: () => {
            deps.dispatch(refreshStakingProductInfoThunk());
        },
        revalidate: now => {
            deps.dispatch(revalidateStakingPositionsThunk({ now }));
        },
        now: deps.now,
        timers: deps.timers,
        subscribeToForeground: deps.subscribeToForeground,
    });

    const loadStakingProducts = () => {
        const descriptors = stakingProductRepository.list().map(adapter => adapter.descriptor);

        if (descriptors.length > 0) {
            stakingScheduler.start();
        }

        deps.dispatch(stakingActions.productsRegistered({ platform: deps.platform, descriptors }));
    };

    return {
        stakingProductRepository,
        loadStakingProducts,
        deviceAccess: deps.deviceAccess,
        stakingScheduler,
    };
};
