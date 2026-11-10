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
import { getSolanaExternalProductAmountBounds } from './amountBounds';
import { createSolanaExternalProductDescriptor } from './descriptor';

export type CreateSolanaExternalProductParams = {
    networkSymbol: NetworkSymbol;
    managedProviders: readonly StakingProvider[];
};

export const createSolanaExternalProduct = ({
    networkSymbol,
    managedProviders,
}: CreateSolanaExternalProductParams): StakingProductAdapter => {
    const managedVoteAccounts = managedProviders.flatMap(
        provider => provider.identities[networkSymbol] ?? [],
    );

    const descriptor = createSolanaExternalProductDescriptor(networkSymbol);

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
        getSolanaExternalProductAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
