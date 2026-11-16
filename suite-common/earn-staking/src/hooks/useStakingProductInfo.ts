import type { StakingProductId, StakingProductInfo } from '@suite-common/earn-staking-common';
import { commonQueryKeys, skipToken, useQuery } from '@suite-common/react-query';
import { useServices } from '@trezor/dependency-injection';

import { injectStakingProductRepository } from '../repository/createStakingProductRepository';
import { getStakingProductInfoQueryOptions } from '../state/stakingProductInfoQuery';

export type StakingProductInfoResult = {
    productInfo: StakingProductInfo | null;
    isPending: boolean;
};

type StakingProductInfoQueryKey = ReturnType<typeof commonQueryKeys.stakingProductInfo>;

const NO_PRODUCT_INFO: StakingProductInfoResult = { productInfo: null, isPending: false };

// A row without a product still calls the hook; it then watches a key no product has and never pends.
const NO_PRODUCT_QUERY_KEY = commonQueryKeys.stakingProductInfo('none');

// Subscribes to the cache only: refreshStakingProductInfoThunk is the one place that fetches.
export const useStakingProductInfo = (
    productId: StakingProductId | null,
): StakingProductInfoResult => {
    const { stakingProductRepository } = useServices(injectStakingProductRepository);

    const { data, isPending } = useQuery<
        StakingProductInfo,
        Error,
        StakingProductInfo,
        StakingProductInfoQueryKey
    >(
        productId === null
            ? { queryKey: NO_PRODUCT_QUERY_KEY, queryFn: skipToken }
            : {
                  ...getStakingProductInfoQueryOptions({ stakingProductRepository, productId }),
                  enabled: false,
              },
    );

    if (productId === null) {
        return NO_PRODUCT_INFO;
    }

    return { productInfo: data ?? null, isPending };
};
