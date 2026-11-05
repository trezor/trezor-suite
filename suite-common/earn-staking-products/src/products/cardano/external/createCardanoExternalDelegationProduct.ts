import type {
    GetAmountBoundsParams,
    GetPositionParams,
    StakingProductAdapter,
    StakingProductDescriptor,
    StakingProvider,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getCardanoExternalDelegationProductAmountBounds } from './cardanoExternalDelegationProductAmountBounds';
import { createCardanoExternalDelegationProductDescriptor } from './cardanoExternalDelegationProductDescriptor';
import { externalProvider } from '../../../providers/external';
import { createUnimplementedStakingOperations } from '../../unimplementedStakingOperations';
import { CARDANO_UNMANAGED_DELEGATION_PRODUCT_INFO } from '../cardanoDelegationProductInfo';
import { getCardanoDelegationProductPosition } from '../getCardanoDelegationProductPosition';

export type CreateCardanoExternalDelegationProductParams = {
    networkSymbol: NetworkSymbol;
    managedProviders: readonly StakingProvider[];
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createCardanoExternalDelegationProduct = ({
    networkSymbol,
    managedProviders,
    messageSystemFeatures,
}: CreateCardanoExternalDelegationProductParams): StakingProductAdapter => {
    const managedPoolIds = managedProviders.flatMap(
        provider => provider.identities[networkSymbol] ?? [],
    );

    const descriptor = createCardanoExternalDelegationProductDescriptor({
        networkSymbol,
        messageSystemFeatures,
    });

    const fetchProductInfo = () => Promise.resolve(CARDANO_UNMANAGED_DELEGATION_PRODUCT_INFO);

    // A registered stake key without a pool is not delegated to any managed provider either.
    const getPosition = (params: GetPositionParams) =>
        getCardanoDelegationProductPosition({
            ...params,
            descriptor,
            provider: externalProvider,
            ownsPool: poolId => poolId === null || !managedPoolIds.includes(poolId),
            ownsPendingFirstStake: false,
        });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getCardanoExternalDelegationProductAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
