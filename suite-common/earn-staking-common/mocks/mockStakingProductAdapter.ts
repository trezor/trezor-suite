import { mock, mockNotExpected } from '@trezor/dependency-injection';

import { mockStakingProductDescriptor } from './mockStakingProductDescriptor';
import type { StakingProductAdapter } from '../src';

export const mockStakingProductAdapter = (
    overrides: Partial<StakingProductAdapter> = {},
): StakingProductAdapter => ({
    descriptor: mockStakingProductDescriptor(),
    fetchProductInfo:
        mockNotExpected<StakingProductAdapter['fetchProductInfo']>('fetchProductInfo'),
    getPosition: mock<StakingProductAdapter['getPosition']>(() => null),
    getAmountBounds: mockNotExpected<StakingProductAdapter['getAmountBounds']>('getAmountBounds'),
    planOperation: mockNotExpected<StakingProductAdapter['planOperation']>('planOperation'),
    composeStep: mockNotExpected<StakingProductAdapter['composeStep']>('composeStep'),
    signStep: mockNotExpected<StakingProductAdapter['signStep']>('signStep'),
    broadcastStep: mockNotExpected<StakingProductAdapter['broadcastStep']>('broadcastStep'),
    ...overrides,
});
