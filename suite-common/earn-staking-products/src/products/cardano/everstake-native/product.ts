import type {
    FetchProductInfoParams,
    GetAmountBoundsParams,
    GetPositionParams,
    StakingProductAdapter,
    StakingProductDescriptor,
    StakingProvider,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { createUnimplementedStakingOperations } from '../../unimplementedStakingOperations';
import { getCardanoProductPosition } from '../position';
import { type CardanoProductInfoDeps, fetchCardanoProductInfo } from '../productInfo';
import { getCardanoEverstakeNativeProductAmountBounds } from './amountBounds';
import { createCardanoEverstakeNativeProductDescriptor } from './descriptor';

export type CardanoEverstakeNativeProductDeps = CardanoProductInfoDeps;

export type CreateCardanoEverstakeNativeProductParams = CardanoEverstakeNativeProductDeps & {
    networkSymbol: NetworkSymbol;
    provider: StakingProvider;
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createCardanoEverstakeNativeProduct = ({
    networkSymbol,
    provider,
    messageSystemFeatures,
    ...deps
}: CreateCardanoEverstakeNativeProductParams): StakingProductAdapter => {
    const poolIds = provider.status === 'active' ? (provider.identities[networkSymbol] ?? []) : [];

    if (poolIds.length === 0) {
        throw new Error(`${provider.id} has no ${networkSymbol} pool`);
    }

    const descriptor = createCardanoEverstakeNativeProductDescriptor({
        networkSymbol,
        provider,
        messageSystemFeatures,
    });

    const fetchProductInfo = (params: FetchProductInfoParams) =>
        fetchCardanoProductInfo(deps, { ...params, provider, poolIds });

    const getPosition = (params: GetPositionParams) =>
        getCardanoProductPosition({
            ...params,
            descriptor,
            provider,
            ownsPool: poolId => poolId !== null && poolIds.includes(poolId),
            ownsPendingFirstStake: true,
        });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getCardanoEverstakeNativeProductAmountBounds({ ...params, limits: descriptor.limits });

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
