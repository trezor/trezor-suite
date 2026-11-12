import type { StakingProductId, StakingProductInfo } from '@suite-common/earn-staking-common';
import { useQuery } from '@suite-common/react-query';
import { useServices } from '@trezor/dependency-injection';

import { injectStakingProductRepository } from '../repository/createStakingProductRepository';
import { getStakingProductInfoQueryOptions } from '../state/stakingProductInfoQuery';

export type StakingProductInfoResult = {
    productInfo: StakingProductInfo | null;
    isPending: boolean;
};

// Subscribes to the cache only: refreshStakingProductInfoThunk is the one place that fetches.
export const useStakingProductInfo = (productId: StakingProductId): StakingProductInfoResult => {
    const { stakingProductRepository } = useServices(injectStakingProductRepository);

    const queryOptions = getStakingProductInfoQueryOptions({ stakingProductRepository, productId });

    const { data, isPending } = useQuery({ ...queryOptions, enabled: false });

    const productInfo = data ?? null;

    return { productInfo, isPending };
};
