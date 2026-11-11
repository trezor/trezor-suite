import type {
    FetchProductInfoParams,
    GetAmountBoundsParams,
    GetPositionParams,
    StakingProductAdapter,
    StakingProductDescriptor,
    StakingProvider,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { createUnimplementedStakingOperations } from '../../unimplementedStakingOperations';
import { getSolanaProductPosition } from '../position';
import { type SolanaProductInfoDeps, fetchSolanaProductInfo } from '../productInfo';
import { getSolanaEverstakeNativeProductAmountBounds } from './amountBounds';
import { createSolanaEverstakeNativeProductDescriptor } from './descriptor';

export type SolanaEverstakeNativeProductDeps = SolanaProductInfoDeps;

export type CreateSolanaEverstakeNativeProductParams = SolanaEverstakeNativeProductDeps & {
    networkSymbol: NetworkSymbol;
    provider: StakingProvider;
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createSolanaEverstakeNativeProduct = ({
    networkSymbol,
    provider,
    messageSystemFeatures,
    ...deps
}: CreateSolanaEverstakeNativeProductParams): StakingProductAdapter => {
    const voteAccounts =
        provider.status === 'active' ? (provider.identities[networkSymbol] ?? []) : [];

    if (voteAccounts.length === 0) {
        throw new Error(`${provider.id} has no ${networkSymbol} vote account`);
    }

    const descriptor = createSolanaEverstakeNativeProductDescriptor({
        networkSymbol,
        provider,
        messageSystemFeatures,
    });

    const fetchProductInfo = (params: FetchProductInfoParams) =>
        fetchSolanaProductInfo(deps, params);

    const getPosition = (params: GetPositionParams) =>
        getSolanaProductPosition({
            ...params,
            descriptor,
            provider,
            ownsVoteAccount: voteAccount =>
                voteAccount !== null && voteAccounts.includes(voteAccount),
        });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getSolanaEverstakeNativeProductAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
