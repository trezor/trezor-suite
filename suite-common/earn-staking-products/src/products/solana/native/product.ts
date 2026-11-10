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
import { type SolanaDelegationProductInfoDeps, fetchSolanaDelegationProductInfo } from '../info';
import { getSolanaDelegationProductPosition } from '../position';
import { getSolanaNativeDelegationProductAmountBounds } from './amountBounds';
import { createSolanaNativeDelegationProductDescriptor } from './descriptor';

export type SolanaNativeDelegationProductDeps = SolanaDelegationProductInfoDeps;

export type CreateSolanaNativeDelegationProductParams = SolanaNativeDelegationProductDeps & {
    networkSymbol: NetworkSymbol;
    provider: StakingProvider;
    messageSystemFeatures: StakingProductDescriptor['messageSystemFeatures'];
};

export const createSolanaNativeDelegationProduct = ({
    networkSymbol,
    provider,
    messageSystemFeatures,
    ...deps
}: CreateSolanaNativeDelegationProductParams): StakingProductAdapter => {
    const voteAccounts =
        provider.status === 'active' ? (provider.identities[networkSymbol] ?? []) : [];

    if (voteAccounts.length === 0) {
        throw new Error(`${provider.id} has no ${networkSymbol} vote account`);
    }

    const descriptor = createSolanaNativeDelegationProductDescriptor({
        networkSymbol,
        provider,
        messageSystemFeatures,
    });

    const fetchProductInfo = (params: FetchProductInfoParams) =>
        fetchSolanaDelegationProductInfo(deps, params);

    const getPosition = (params: GetPositionParams) =>
        getSolanaDelegationProductPosition({
            ...params,
            descriptor,
            provider,
            ownsVoteAccount: voteAccount =>
                voteAccount !== null && voteAccounts.includes(voteAccount),
        });

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getSolanaNativeDelegationProductAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
