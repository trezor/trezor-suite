import type { StakingDeviceAccess } from './createStakingDeviceAccess';
import type { StakingProductRepositoryDep } from './repository/createStakingProductRepository';

/**
 * Loads the products of the enabled networks and registers them in the store; a module that
 * fails to load is logged and loaded again by the next call, so the promise never rejects.
 */
export type LoadStakingProducts = () => Promise<void>;

export type LoadStakingProductsDep = {
    loadStakingProducts: LoadStakingProducts;
};

export type StakingServices = StakingProductRepositoryDep &
    LoadStakingProductsDep & {
        deviceAccess: StakingDeviceAccess;
    };

export type StakingDep = { staking: StakingServices };
