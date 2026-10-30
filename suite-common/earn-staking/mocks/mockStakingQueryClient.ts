import type { StakingProductId, StakingProductInfo } from '@suite-common/earn-staking-common';
import { type QueryClient, commonQueryKeys, createQueryClient } from '@suite-common/react-query';

type MockStakingQueryClientParams = {
    productInfo?: Partial<Record<StakingProductId, StakingProductInfo>>;
};

export const mockStakingQueryClient = ({
    productInfo = {},
}: MockStakingQueryClientParams = {}): QueryClient => {
    const queryClient = createQueryClient({ shouldRefetchOnEvents: false });

    Object.entries(productInfo).forEach(([productId, info]) => {
        if (info === undefined) return;

        queryClient.setQueryData(commonQueryKeys.stakingProductInfo(productId), info);
    });

    return queryClient;
};
