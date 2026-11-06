import type { Dispatch } from '@reduxjs/toolkit';

import type { StakingPlatform, StakingProductModule } from '@suite-common/earn-staking-common';
import type { Getter } from '@trezor/dependency-injection';
import type { NetworkSymbol } from '@trezor/network-module-types';

import type { StakingDeviceAccess } from './createStakingDeviceAccess';
import { createStakingProductRepository } from './repository/createStakingProductRepository';
import type { LoadStakingProducts, StakingServices } from './stakingServices';
import { stakingActions } from './state/stakingReducer';

export type StakingCompositionRootDeps = {
    platform: StakingPlatform;
    productModules: readonly StakingProductModule[];
    deviceAccess: StakingDeviceAccess;
    dispatch: Dispatch;
    getEnabledNetworks: Getter<[], readonly NetworkSymbol[]>;
};

export const createStakingCompositionRoot = (deps: StakingCompositionRootDeps): StakingServices => {
    const stakingProductRepository = createStakingProductRepository({
        productModules: deps.productModules,
        onProductsRegistered: adapters => {
            deps.dispatch(
                stakingActions.productsRegistered({
                    platform: deps.platform,
                    descriptors: adapters.map(adapter => adapter.descriptor),
                }),
            );
        },
    });

    const loadStakingProducts: LoadStakingProducts = async () => {
        try {
            await stakingProductRepository.ensureLoaded(deps.getEnabledNetworks());
        } catch (error) {
            // The repository's error already names every module that failed and why.
            console.warn(
                error instanceof Error
                    ? error.message
                    : 'Staking product modules failed to load: Unknown error',
            );
        }
    };

    return {
        stakingProductRepository,
        loadStakingProducts,
        deviceAccess: deps.deviceAccess,
    };
};
