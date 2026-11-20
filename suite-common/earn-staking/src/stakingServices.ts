import type { StakingDeviceAccess } from './createStakingDeviceAccess';
import type { StakingProductRepositoryDep } from './repository/createStakingProductRepository';

export type LoadStakingProducts = () => void;

export type LoadStakingProductsDep = {
    loadStakingProducts: LoadStakingProducts;
};

export type StakingServices = StakingProductRepositoryDep &
    LoadStakingProductsDep & {
        deviceAccess: StakingDeviceAccess;
    };

export type StakingDep = { staking: StakingServices };
