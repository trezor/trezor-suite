import type {
    FetchProductInfoParams,
    GetAmountBoundsParams,
    GetPositionParams,
    StakingProductAdapter,
    StakingProductDescriptor,
    StakingProvider,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getCardanoNativeDelegationProductAmountBounds } from './cardanoNativeDelegationProductAmountBounds';
import { createCardanoNativeDelegationProductDescriptor } from './cardanoNativeDelegationProductDescriptor';
import { createUnimplementedStakingOperations } from '../../unimplementedStakingOperations';
import {
    type CardanoDelegationProductInfoDeps,
    fetchCardanoDelegationProductInfo,
} from '../cardanoDelegationProductInfo';
import { getCardanoDelegationProductPosition } from '../getCardanoDelegationProductPosition';

export type CardanoNativeDelegationProductDeps = CardanoDelegationProductInfoDeps;

export type CreateCardanoNativeDelegationProductParams = CardanoNativeDelegationProductDeps & {
    networkSymbol: NetworkSymbol;
    provider: StakingProvider;
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createCardanoNativeDelegationProduct = ({
    networkSymbol,
    provider,
    messageSystemFeatures,
    ...deps
}: CreateCardanoNativeDelegationProductParams): StakingProductAdapter => {
    const poolIds = provider.status === 'active' ? (provider.identities[networkSymbol] ?? []) : [];

    if (poolIds.length === 0) {
        throw new Error(`${provider.id} has no ${networkSymbol} pool`);
    }

    const descriptor = createCardanoNativeDelegationProductDescriptor({
        networkSymbol,
        provider,
        messageSystemFeatures,
    });

    const fetchProductInfo = (params: FetchProductInfoParams) =>
        fetchCardanoDelegationProductInfo(deps, { ...params, provider, poolIds });

    const getPosition = (params: GetPositionParams) =>
        getCardanoDelegationProductPosition({
            ...params,
            descriptor,
            provider,
            ownsPool: poolId => poolId !== null && poolIds.includes(poolId),
            ownsPendingFirstStake: true,
        });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getCardanoNativeDelegationProductAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
