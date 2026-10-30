import type { StakingProductRepositoryDep } from './repository/createStakingProductRepository';

export type StakingServices = StakingProductRepositoryDep;

export type StakingDep = { staking: StakingServices };
