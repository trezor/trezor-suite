import type { StakingProductId, StakingProductInfo } from '@suite-common/earn-staking-common';
import { type QueryClient, commonQueryKeys } from '@suite-common/react-query';

import type { StakingProductRepositoryDep } from '../repository/createStakingProductRepository';

type StakingProductInfoQueryParams = StakingProductRepositoryDep & {
    productId: StakingProductId;
};

export const getStakingProductInfoQueryOptions = (params: StakingProductInfoQueryParams) => ({
    queryKey: commonQueryKeys.stakingProductInfo(params.productId),
    queryFn: (): Promise<StakingProductInfo> =>
        params.stakingProductRepository.get(params.productId).fetchProductInfo({}),
    // Positions are derived from the info, so it stays cached without a subscriber.
    gcTime: Infinity,
    // An offline fetch fails right away instead of pausing the refresh until online.
    networkMode: 'always' as const,
});

export const getCachedStakingProductInfo = (
    queryClient: QueryClient,
    productId: StakingProductId,
): StakingProductInfo | null =>
    queryClient.getQueryData<StakingProductInfo>(commonQueryKeys.stakingProductInfo(productId)) ??
    null;
