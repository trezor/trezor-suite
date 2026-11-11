import type {
    FetchProductInfoParams,
    GetAmountBoundsParams,
    GetPositionParams,
    StakingProductAdapter,
    StakingProductDescriptor,
    StakingProvider,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getTronNativeProductAmountBounds } from './amountBounds';
import { createTronNativeProductDescriptor } from './descriptor';
import { getTronNativeProductPosition } from './position';
import { type TronNativeProductInfoDeps, fetchTronNativeProductInfo } from './productInfo';
import { getTronSuperRepresentatives } from './utils';
import { createUnimplementedStakingOperations } from '../../unimplementedStakingOperations';

export type TronNativeProductDeps = TronNativeProductInfoDeps;

export type CreateTronNativeProductParams = TronNativeProductDeps & {
    networkSymbol: NetworkSymbol;
    providers: readonly StakingProvider[];
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createTronNativeProduct = ({
    networkSymbol,
    providers,
    messageSystemFeatures,
    ...deps
}: CreateTronNativeProductParams): StakingProductAdapter => {
    const superRepresentatives = getTronSuperRepresentatives({ networkSymbol, providers });

    if (superRepresentatives.length === 0) {
        throw new Error(`no ${networkSymbol} super representative to vote for`);
    }

    const descriptor = createTronNativeProductDescriptor({ networkSymbol, messageSystemFeatures });

    const fetchProductInfo = (params: FetchProductInfoParams) =>
        fetchTronNativeProductInfo(deps, { ...params, superRepresentatives });

    const getPosition = (params: GetPositionParams) =>
        getTronNativeProductPosition({ ...params, descriptor, superRepresentatives });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getTronNativeProductAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
