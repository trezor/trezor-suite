import type {
    GetAmountBoundsParams,
    GetPositionParams,
    StakingProductAdapter,
    StakingProductDescriptor,
    StakingProvider,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { externalProvider } from '../../../providers/external';
import { createUnimplementedStakingOperations } from '../../unimplementedStakingOperations';
import { getCardanoProductPosition } from '../position';
import { CARDANO_UNMANAGED_PRODUCT_INFO } from '../productInfo';
import { getCardanoExternalNativeProductAmountBounds } from './amountBounds';
import { createCardanoExternalNativeProductDescriptor } from './descriptor';

export type CreateCardanoExternalNativeProductParams = {
    networkSymbol: NetworkSymbol;
    managedProviders: readonly StakingProvider[];
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createCardanoExternalNativeProduct = ({
    networkSymbol,
    managedProviders,
    messageSystemFeatures,
}: CreateCardanoExternalNativeProductParams): StakingProductAdapter => {
    const managedPoolIds = managedProviders.flatMap(
        provider => provider.identities[networkSymbol] ?? [],
    );

    const descriptor = createCardanoExternalNativeProductDescriptor({
        networkSymbol,
        messageSystemFeatures,
    });

    const fetchProductInfo = () => Promise.resolve(CARDANO_UNMANAGED_PRODUCT_INFO);

    // A registered stake key without a pool is not delegated to any managed provider either.
    const getPosition = (params: GetPositionParams) =>
        getCardanoProductPosition({
            ...params,
            descriptor,
            provider: externalProvider,
            ownsPool: poolId => poolId === null || !managedPoolIds.includes(poolId),
            ownsPendingFirstStake: false,
        });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getCardanoExternalNativeProductAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
