import type { StakingProductRepositoryDep } from './repository/createStakingProductRepository';

export type LoadStakingProducts = () => void;

export type LoadStakingProductsDep = {
    loadStakingProducts: LoadStakingProducts;
};

export type StakingServices = StakingProductRepositoryDep & LoadStakingProductsDep;

export type StakingDep = { staking: StakingServices };
