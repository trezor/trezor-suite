import { mock, mockNotExpected } from '@trezor/dependency-injection';

import type { StakingProductRepository } from '../src';

export const mockStakingProductRepository = (
    overrides: Partial<StakingProductRepository> = {},
): StakingProductRepository => ({
    get: mockNotExpected<StakingProductRepository['get']>('get'),
    list: mock<StakingProductRepository['list']>(() => []),
    listBySymbol: mock<StakingProductRepository['listBySymbol']>(() => []),
    isSupportedSymbol: mock<StakingProductRepository['isSupportedSymbol']>(() => false),
    ...overrides,
});
