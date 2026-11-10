import type {
    FetchProductInfoParams,
    GetAmountBoundsParams,
    GetPositionParams,
    StakingProductAdapter,
    StakingProductDescriptor,
    StakingProvider,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getTronCuratedProductAmountBounds } from './amountBounds';
import { createTronCuratedProductDescriptor } from './descriptor';
import { type TronCuratedProductInfoDeps, fetchTronCuratedProductInfo } from './info';
import { getTronCuratedProductPosition } from './position';
import { getTronRepresentatives } from './utils';
import { createUnimplementedStakingOperations } from '../../unimplementedStakingOperations';

export type TronCuratedProductDeps = TronCuratedProductInfoDeps;

export type CreateTronCuratedProductParams = TronCuratedProductDeps & {
    networkSymbol: NetworkSymbol;
    providers: readonly StakingProvider[];
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createTronCuratedProduct = ({
    networkSymbol,
    providers,
    messageSystemFeatures,
    ...deps
}: CreateTronCuratedProductParams): StakingProductAdapter => {
    const representatives = getTronRepresentatives({ networkSymbol, providers });

    if (representatives.length === 0) {
        throw new Error(`no ${networkSymbol} representative to vote for`);
    }

    const descriptor = createTronCuratedProductDescriptor({ networkSymbol, messageSystemFeatures });

    const fetchProductInfo = (params: FetchProductInfoParams) =>
        fetchTronCuratedProductInfo(deps, { ...params, representatives });

    const getPosition = (params: GetPositionParams) =>
        getTronCuratedProductPosition({ ...params, descriptor, representatives });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getTronCuratedProductAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
