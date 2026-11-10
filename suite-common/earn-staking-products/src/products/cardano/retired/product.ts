import type {
    GetAmountBoundsParams,
    GetPositionParams,
    StakingProductAdapter,
    StakingProductDescriptor,
    StakingProvider,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getCardanoRetiredDelegationProductAmountBounds } from './amountBounds';
import { createCardanoRetiredDelegationProductDescriptor } from './descriptor';
import { createUnimplementedStakingOperations } from '../../unimplementedStakingOperations';
import { CARDANO_UNMANAGED_DELEGATION_PRODUCT_INFO } from '../info';
import { getCardanoDelegationProductPosition } from '../position';

export type CreateCardanoRetiredDelegationProductParams = {
    networkSymbol: NetworkSymbol;
    provider: StakingProvider;
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createCardanoRetiredDelegationProduct = ({
    networkSymbol,
    provider,
    messageSystemFeatures,
}: CreateCardanoRetiredDelegationProductParams): StakingProductAdapter => {
    const poolIds = provider.status === 'retired' ? (provider.identities[networkSymbol] ?? []) : [];

    if (poolIds.length === 0) {
        throw new Error(`${provider.id} has no retired ${networkSymbol} pool`);
    }

    const descriptor = createCardanoRetiredDelegationProductDescriptor({
        networkSymbol,
        provider,
        messageSystemFeatures,
    });

    const fetchProductInfo = () => Promise.resolve(CARDANO_UNMANAGED_DELEGATION_PRODUCT_INFO);

    const getPosition = (params: GetPositionParams) =>
        getCardanoDelegationProductPosition({
            ...params,
            descriptor,
            provider,
            ownsPool: poolId => poolId !== null && poolIds.includes(poolId),
            ownsPendingFirstStake: false,
        });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getCardanoRetiredDelegationProductAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
