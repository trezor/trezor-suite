import { mock } from '@trezor/dependency-injection';

import { mockStakingProductRepository } from './mockStakingProductRepository';
import type { LoadStakingProducts, StakingServices } from '../src/stakingServices';

export const mockStakingServices = (overrides: Partial<StakingServices> = {}): StakingServices => ({
    stakingProductRepository: mockStakingProductRepository(),
    loadStakingProducts: mock<LoadStakingProducts>(() => {}),
    ...overrides,
});
