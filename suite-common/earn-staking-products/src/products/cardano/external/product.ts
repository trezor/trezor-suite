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
import { CARDANO_UNMANAGED_PRODUCT_INFO } from '../info';
import { getCardanoProductPosition } from '../position';
import { getCardanoExternalProductAmountBounds } from './amountBounds';
import { createCardanoExternalProductDescriptor } from './descriptor';

export type CreateCardanoExternalProductParams = {
    networkSymbol: NetworkSymbol;
    managedProviders: readonly StakingProvider[];
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createCardanoExternalProduct = ({
    networkSymbol,
    managedProviders,
    messageSystemFeatures,
}: CreateCardanoExternalProductParams): StakingProductAdapter => {
    const managedPoolIds = managedProviders.flatMap(
        provider => provider.identities[networkSymbol] ?? [],
    );

    const descriptor = createCardanoExternalProductDescriptor({
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
        getCardanoExternalProductAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
