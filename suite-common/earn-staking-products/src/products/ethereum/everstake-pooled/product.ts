import type {
    FetchProductInfoParams,
    GetAmountBoundsParams,
    GetPositionParams,
    StakingProductAdapter,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getEthereumEverstakePooledProductAmountBounds } from './amountBounds';
import { EVERSTAKE_POOL_ADDRESSES } from './constants';
import { createEthereumEverstakePooledProductDescriptor } from './descriptor';
import { getEthereumEverstakePooledProductPosition } from './position';
import {
    type EthereumEverstakePooledProductInfoDeps,
    fetchEthereumEverstakePooledProductInfo,
} from './productInfo';
import { createUnimplementedStakingOperations } from '../../unimplementedStakingOperations';

export type EthereumEverstakePooledProductDeps = EthereumEverstakePooledProductInfoDeps;

export type CreateEthereumEverstakePooledProductParams = EthereumEverstakePooledProductDeps & {
    networkSymbol: NetworkSymbol;
};

export const createEthereumEverstakePooledProduct = ({
    networkSymbol,
    ...deps
}: CreateEthereumEverstakePooledProductParams): StakingProductAdapter => {
    const descriptor = createEthereumEverstakePooledProductDescriptor(networkSymbol);

    const poolAddress = EVERSTAKE_POOL_ADDRESSES[networkSymbol];

    if (poolAddress === undefined) {
        throw new Error(`Everstake has no pool contract on ${networkSymbol}`);
    }

    const fetchProductInfo = (params: FetchProductInfoParams) =>
        fetchEthereumEverstakePooledProductInfo(deps, params);

    const getPosition = (params: GetPositionParams) =>
        getEthereumEverstakePooledProductPosition({
            productId: descriptor.id,
            poolAddress,
            ...params,
        });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getEthereumEverstakePooledProductAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
