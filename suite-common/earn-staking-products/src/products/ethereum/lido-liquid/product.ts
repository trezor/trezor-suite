import type {
    FetchProductInfoParams,
    GetAmountBoundsParams,
    GetPositionParams,
    StakingProductAdapter,
} from '@suite-common/earn-staking-common';
import { getLidoDeployment } from '@trezor/network-ethereum-suite-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getEthereumLidoLiquidProductAmountBounds } from './amountBounds';
import { createEthereumLidoLiquidProductDescriptor } from './descriptor';
import { getEthereumLidoLiquidProductPosition } from './position';
import {
    type EthereumLidoLiquidProductInfoDeps,
    fetchEthereumLidoLiquidProductInfo,
} from './productInfo';
import { createUnimplementedStakingOperations } from '../../unimplementedStakingOperations';

export type EthereumLidoLiquidProductDeps = EthereumLidoLiquidProductInfoDeps & {
    fetchWithdrawalBalances: NonNullable<StakingProductAdapter['fetchWithdrawalBalances']>;
};

export type CreateEthereumLidoLiquidProductParams = EthereumLidoLiquidProductDeps & {
    networkSymbol: NetworkSymbol;
};

export const createEthereumLidoLiquidProduct = ({
    networkSymbol,
    ...deps
}: CreateEthereumLidoLiquidProductParams): StakingProductAdapter => {
    const deployment = getLidoDeployment(networkSymbol);

    if (deployment === null) {
        throw new Error(`Lido has no contracts on ${networkSymbol}`);
    }

    const descriptor = createEthereumLidoLiquidProductDescriptor({ networkSymbol });

    const fetchProductInfo = (params: FetchProductInfoParams) =>
        fetchEthereumLidoLiquidProductInfo(deps, { ...params, networkSymbol, deployment });

    const getPosition = (params: GetPositionParams) =>
        getEthereumLidoLiquidProductPosition({ productId: descriptor.id, deployment, ...params });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getEthereumLidoLiquidProductAmountBounds({ ...params, limits: descriptor.limits });

    // The flows compose, sign and broadcast through their own thunks until the product kit lands.
    const operations = createUnimplementedStakingOperations();

    return {
        descriptor,
        fetchProductInfo,
        getPosition,
        getAmountBounds,
        fetchWithdrawalBalances: deps.fetchWithdrawalBalances,
        ...operations,
    };
};
