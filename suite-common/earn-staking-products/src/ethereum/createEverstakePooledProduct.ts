import type { StakingProductAdapter } from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getEverstakePooledAmountBounds } from './everstakePooledAmountBounds';
import { createEverstakePooledDescriptor } from './everstakePooledDescriptor';
import {
    type EverstakePooledProductInfoDeps,
    fetchEverstakePooledProductInfo,
} from './everstakePooledProductInfo';
import { createUnimplementedStakingOperations } from '../shared/unimplementedStakingOperations';

export type EverstakePooledProductDeps = EverstakePooledProductInfoDeps;

export type CreateEverstakePooledProductParams = EverstakePooledProductDeps & {
    networkSymbol: NetworkSymbol;
};

export const createEverstakePooledProduct = ({
    networkSymbol,
    ...deps
}: CreateEverstakePooledProductParams): StakingProductAdapter => ({
    descriptor: createEverstakePooledDescriptor(networkSymbol),
    fetchProductInfo: params => fetchEverstakePooledProductInfo(deps, params),
    getPosition: () => null,
    getAmountBounds: getEverstakePooledAmountBounds,
    ...createUnimplementedStakingOperations(),
});
