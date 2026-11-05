import type {
    GetAmountBoundsParams,
    GetPositionParams,
    StakingProductAdapter,
    StakingProvider,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getSolanaDelegationPosition } from './getSolanaDelegationPosition';
import { getSolanaExternalDelegationAmountBounds } from './solanaDelegationAmountBounds';
import { createSolanaExternalDelegationDescriptor } from './solanaDelegationDescriptors';
import { SOLANA_EXTERNAL_PRODUCT_INFO } from './solanaDelegationProductInfo';
import { externalProvider } from '../providers/external';
import { createUnimplementedStakingOperations } from '../shared/unimplementedStakingOperations';

export type CreateSolanaExternalDelegationProductParams = {
    networkSymbol: NetworkSymbol;
    managedProviders: readonly StakingProvider[];
};

export const createSolanaExternalDelegationProduct = ({
    networkSymbol,
    managedProviders,
}: CreateSolanaExternalDelegationProductParams): StakingProductAdapter => {
    const managedVoteAccounts = managedProviders.flatMap(
        provider => provider.identities[networkSymbol] ?? [],
    );

    const descriptor = createSolanaExternalDelegationDescriptor(networkSymbol);

    const fetchProductInfo = () => Promise.resolve(SOLANA_EXTERNAL_PRODUCT_INFO);

    const getPosition = (params: GetPositionParams) =>
        getSolanaDelegationPosition({
            ...params,
            descriptor,
            provider: externalProvider,
            ownsVoteAccount: voteAccount =>
                voteAccount === null || !managedVoteAccounts.includes(voteAccount),
        });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getSolanaExternalDelegationAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
