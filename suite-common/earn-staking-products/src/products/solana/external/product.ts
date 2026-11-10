import type {
    GetAmountBoundsParams,
    GetPositionParams,
    StakingProductAdapter,
    StakingProvider,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { externalProvider } from '../../../providers/external';
import { createUnimplementedStakingOperations } from '../../unimplementedStakingOperations';
import { SOLANA_EXTERNAL_PRODUCT_INFO } from '../info';
import { getSolanaDelegationProductPosition } from '../position';
import { getSolanaExternalDelegationProductAmountBounds } from './amountBounds';
import { createSolanaExternalDelegationProductDescriptor } from './descriptor';

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

    const descriptor = createSolanaExternalDelegationProductDescriptor(networkSymbol);

    const fetchProductInfo = () => Promise.resolve(SOLANA_EXTERNAL_PRODUCT_INFO);

    const getPosition = (params: GetPositionParams) =>
        getSolanaDelegationProductPosition({
            ...params,
            descriptor,
            provider: externalProvider,
            ownsVoteAccount: voteAccount =>
                voteAccount === null || !managedVoteAccounts.includes(voteAccount),
        });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getSolanaExternalDelegationProductAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
