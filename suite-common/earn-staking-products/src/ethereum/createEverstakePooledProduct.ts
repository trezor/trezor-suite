import type {
    FetchProductInfoParams,
    GetAmountBoundsParams,
    GetPositionParams,
    StakingProductAdapter,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getEverstakePooledAmountBounds } from './everstakePooledAmountBounds';
import { createEverstakePooledDescriptor } from './everstakePooledDescriptor';
import {
    type EverstakePooledProductInfoDeps,
    fetchEverstakePooledProductInfo,
} from './everstakePooledProductInfo';
import { getEverstakePooledPosition } from './getEverstakePooledPosition';
import { createUnimplementedStakingOperations } from '../shared/unimplementedStakingOperations';

export type EverstakePooledProductDeps = EverstakePooledProductInfoDeps;

export type CreateEverstakePooledProductParams = EverstakePooledProductDeps & {
    networkSymbol: NetworkSymbol;
};

export const createEverstakePooledProduct = ({
    networkSymbol,
    ...deps
}: CreateEverstakePooledProductParams): StakingProductAdapter => {
    const descriptor = createEverstakePooledDescriptor(networkSymbol);

    const fetchProductInfo = (params: FetchProductInfoParams) =>
        fetchEverstakePooledProductInfo(deps, params);

    const getPosition = (params: GetPositionParams) =>
        getEverstakePooledPosition({ productId: descriptor.id, ...params });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getEverstakePooledAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
