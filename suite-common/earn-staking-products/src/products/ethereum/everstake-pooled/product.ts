import type {
    FetchProductInfoParams,
    GetAmountBoundsParams,
    GetPositionParams,
    StakingProductAdapter,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getEverstakePooledProductAmountBounds } from './amountBounds';
import { EVERSTAKE_POOLED_PRODUCT_POOL_ADDRESSES } from './constants';
import { createEverstakePooledProductDescriptor } from './descriptor';
import { type EverstakePooledProductInfoDeps, fetchEverstakePooledProductInfo } from './info';
import { getEverstakePooledProductPosition } from './position';
import { createUnimplementedStakingOperations } from '../../unimplementedStakingOperations';

export type EverstakePooledProductDeps = EverstakePooledProductInfoDeps;

export type CreateEverstakePooledProductParams = EverstakePooledProductDeps & {
    networkSymbol: NetworkSymbol;
};

export const createEverstakePooledProduct = ({
    networkSymbol,
    ...deps
}: CreateEverstakePooledProductParams): StakingProductAdapter => {
    const descriptor = createEverstakePooledProductDescriptor(networkSymbol);

    const poolAddress = EVERSTAKE_POOLED_PRODUCT_POOL_ADDRESSES[networkSymbol];

    if (poolAddress === undefined) {
        throw new Error(`Everstake has no pool contract on ${networkSymbol}`);
    }

    const fetchProductInfo = (params: FetchProductInfoParams) =>
        fetchEverstakePooledProductInfo(deps, params);

    const getPosition = (params: GetPositionParams) =>
        getEverstakePooledProductPosition({ productId: descriptor.id, poolAddress, ...params });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getEverstakePooledProductAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
