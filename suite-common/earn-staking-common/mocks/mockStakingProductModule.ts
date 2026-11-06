import { mock } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { mockStakingProductAdapter } from './mockStakingProductAdapter';
import type { StakingProductModule } from '../src';

export const mockStakingProductModule = (
    overrides: Partial<StakingProductModule> = {},
): StakingProductModule => ({
    networkSymbols: [asNetworkSymbol('eth')],
    load: mock<StakingProductModule['load']>(() => Promise.resolve([mockStakingProductAdapter()])),
    ...overrides,
});
