import { mock } from '@trezor/dependency-injection';

import { mockStakingDeviceAccess } from './mockStakingDeviceAccess';
import { mockStakingProductRepository } from './mockStakingProductRepository';
import type { LoadStakingProducts, StakingServices } from '../src/stakingServices';

export const mockStakingServices = (overrides: Partial<StakingServices> = {}): StakingServices => ({
    stakingProductRepository: mockStakingProductRepository(),
    loadStakingProducts: mock<LoadStakingProducts>(() => Promise.resolve()),
    deviceAccess: mockStakingDeviceAccess(),
    ...overrides,
});
