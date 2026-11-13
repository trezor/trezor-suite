import type {
    GetAmountBoundsParams,
    GetPositionParams,
    StakingProductAdapter,
    StakingProductDescriptor,
    StakingProvider,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { createUnimplementedStakingOperations } from '../../unimplementedStakingOperations';
import { getCardanoProductPosition } from '../position';
import { CARDANO_UNMANAGED_PRODUCT_INFO } from '../productInfo';
import { getCardanoFivebinariesNativeProductAmountBounds } from './amountBounds';
import { createCardanoFivebinariesNativeProductDescriptor } from './descriptor';

export type CreateCardanoFivebinariesNativeProductParams = {
    networkSymbol: NetworkSymbol;
    provider: StakingProvider;
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createCardanoFivebinariesNativeProduct = ({
    networkSymbol,
    provider,
    messageSystemFeatures,
}: CreateCardanoFivebinariesNativeProductParams): StakingProductAdapter => {
    const poolIds = provider.status === 'retired' ? (provider.identities[networkSymbol] ?? []) : [];

    if (poolIds.length === 0) {
        throw new Error(`${provider.id} has no retired ${networkSymbol} pool`);
    }

    const descriptor = createCardanoFivebinariesNativeProductDescriptor({
        networkSymbol,
        provider,
        messageSystemFeatures,
    });

    const fetchProductInfo = () => Promise.resolve(CARDANO_UNMANAGED_PRODUCT_INFO);

    const getPosition = (params: GetPositionParams) =>
        getCardanoProductPosition({
            ...params,
            descriptor,
            provider,
            ownsPool: poolId => poolId !== null && poolIds.includes(poolId),
            ownsPendingFirstStake: false,
        });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getCardanoFivebinariesNativeProductAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
