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
import { type TronNativeProductInfoDeps, fetchTronNativeProductInfo } from './info';
import { getTronNativeProductPosition } from './position';
import { getTronRepresentatives } from './utils';
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
    const representatives = getTronRepresentatives({ networkSymbol, providers });

    if (representatives.length === 0) {
        throw new Error(`no ${networkSymbol} representative to vote for`);
    }

    const descriptor = createTronNativeProductDescriptor({ networkSymbol, messageSystemFeatures });

    const fetchProductInfo = (params: FetchProductInfoParams) =>
        fetchTronNativeProductInfo(deps, { ...params, representatives });

    const getPosition = (params: GetPositionParams) =>
        getTronNativeProductPosition({ ...params, descriptor, representatives });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getTronNativeProductAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
