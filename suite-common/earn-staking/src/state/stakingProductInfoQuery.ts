import type { StakingProductId, StakingProductInfo } from '@suite-common/earn-staking-common';
import { type QueryClient, SILENT_QUERY_META, commonQueryKeys } from '@suite-common/react-query';

import type { StakingProductRepositoryDep } from '../repository/createStakingProductRepository';

type StakingProductInfoQueryParams = StakingProductRepositoryDep & {
    productId: StakingProductId;
};

export const getStakingProductInfoQueryOptions = ({
    stakingProductRepository,
    productId,
}: StakingProductInfoQueryParams) => ({
    queryKey: commonQueryKeys.stakingProductInfo(productId),
    queryFn: (): Promise<StakingProductInfo> =>
        stakingProductRepository.get(productId).fetchProductInfo({}),
    gcTime: Infinity,
    networkMode: 'always' as const,
    meta: SILENT_QUERY_META,
});

export const getCachedStakingProductInfo = (
    queryClient: QueryClient,
    productId: StakingProductId,
): StakingProductInfo | null =>
    queryClient.getQueryData<StakingProductInfo>(commonQueryKeys.stakingProductInfo(productId)) ??
    null;
