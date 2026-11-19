import type { StakingProductId, StakingProductInfo } from '@suite-common/earn-staking-common';
import { commonQueryKeys, skipToken, useQuery } from '@suite-common/react-query';

export type StakingProductInfoResult = {
    productInfo: StakingProductInfo | null;
    isPending: boolean;
};

type StakingProductInfoQueryKey = ReturnType<typeof commonQueryKeys.stakingProductInfo>;

const NO_PRODUCT_INFO: StakingProductInfoResult = { productInfo: null, isPending: false };

// A row without a product still calls the hook; it then watches a key no product has and never pends.
const NO_PRODUCT_KEY = 'none';

// Subscribes to the cache only: refreshStakingProductInfoThunk is the one place that fetches, so
// the query never runs from here, whatever the product.
export const useStakingProductInfo = (
    productId: StakingProductId | null,
): StakingProductInfoResult => {
    const { data, isPending } = useQuery<
        StakingProductInfo,
        Error,
        StakingProductInfo,
        StakingProductInfoQueryKey
    >({
        queryKey: commonQueryKeys.stakingProductInfo(productId ?? NO_PRODUCT_KEY),
        queryFn: skipToken,
        gcTime: Infinity,
    });

    if (productId === null) {
        return NO_PRODUCT_INFO;
    }

    return { productInfo: data ?? null, isPending };
};
