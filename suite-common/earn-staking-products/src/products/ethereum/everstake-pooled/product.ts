import type {
    FetchProductInfoParams,
    GetAmountBoundsParams,
    GetPositionParams,
    StakingProductAdapter,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getEthereumEverstakePooledProductAmountBounds } from './amountBounds';
import { getEverstakePoolDeployment } from './deployments';
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
    const deployment = getEverstakePoolDeployment(networkSymbol);

    const descriptor = createEthereumEverstakePooledProductDescriptor({
        networkSymbol,
        deployment,
    });

    const { poolAddress } = deployment;

    const fetchProductInfo = (params: FetchProductInfoParams) =>
        fetchEthereumEverstakePooledProductInfo(deps, params);

    const getPosition = (params: GetPositionParams) =>
        getEthereumEverstakePooledProductPosition({
            productId: descriptor.id,
            poolAddress,
            ...params,
        });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getEthereumEverstakePooledProductAmountBounds({ ...params, limits: descriptor.limits });

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
