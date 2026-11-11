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
import { getSolanaProductPosition } from '../position';
import { getSolanaExternalNativeProductAmountBounds } from './amountBounds';
import { createSolanaExternalNativeProductDescriptor } from './descriptor';

export type CreateSolanaExternalNativeProductParams = {
    networkSymbol: NetworkSymbol;
    managedProviders: readonly StakingProvider[];
};

export const createSolanaExternalNativeProduct = ({
    networkSymbol,
    managedProviders,
}: CreateSolanaExternalNativeProductParams): StakingProductAdapter => {
    const managedVoteAccounts = managedProviders.flatMap(
        provider => provider.identities[networkSymbol] ?? [],
    );

    const descriptor = createSolanaExternalNativeProductDescriptor(networkSymbol);

    const fetchProductInfo = () => Promise.resolve(SOLANA_EXTERNAL_PRODUCT_INFO);

    const getPosition = (params: GetPositionParams) =>
        getSolanaProductPosition({
            ...params,
            descriptor,
            provider: externalProvider,
            ownsVoteAccount: voteAccount =>
                voteAccount === null || !managedVoteAccounts.includes(voteAccount),
        });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getSolanaExternalNativeProductAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
