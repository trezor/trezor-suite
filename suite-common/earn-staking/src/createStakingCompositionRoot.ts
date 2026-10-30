import type { StakingPlatform, StakingProductAdapter } from '@suite-common/earn-staking-common';
import type { Dispatch } from '@trezor/redux-utils';

import { createStakingProductRepository } from './repository/createStakingProductRepository';
import type { StakingServices } from './stakingServices';
import { stakingActions } from './state/stakingReducer';
import { syncAllStakingPositionsThunk } from './state/stakingThunks';

export type StakingCompositionRootDeps = {
    platform: StakingPlatform;
    adapters: readonly StakingProductAdapter[];
    dispatch: Dispatch;
};

export const createStakingCompositionRoot = (deps: StakingCompositionRootDeps): StakingServices => {
    const stakingProductRepository = createStakingProductRepository({ adapters: deps.adapters });

    const loadStakingProducts = () => {
        deps.dispatch(
            stakingActions.productsRegistered({
                platform: deps.platform,
                descriptors: stakingProductRepository.list().map(adapter => adapter.descriptor),
            }),
        );
        deps.dispatch(syncAllStakingPositionsThunk());
    };

    return { stakingProductRepository, loadStakingProducts };
};
