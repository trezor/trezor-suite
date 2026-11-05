import type {
    FetchProductInfoParams,
    GetAmountBoundsParams,
    StakingProductAdapter,
    StakingProductDescriptor,
    StakingProvider,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getSolanaNativeDelegationAmountBounds } from './solanaDelegationAmountBounds';
import { createSolanaNativeDelegationDescriptor } from './solanaDelegationDescriptors';
import {
    type SolanaDelegationProductInfoDeps,
    fetchSolanaDelegationProductInfo,
} from './solanaDelegationProductInfo';
import { createUnimplementedStakingOperations } from '../shared/unimplementedStakingOperations';

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

    const descriptor = createSolanaNativeDelegationDescriptor({
        networkSymbol,
        provider,
        messageSystemFeatures,
    });

    const fetchProductInfo = (params: FetchProductInfoParams) =>
        fetchSolanaDelegationProductInfo(deps, params);

    const getPosition = () => null;

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getSolanaNativeDelegationAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
