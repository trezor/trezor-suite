import type { StakingProductId, StakingProductTarget } from '@suite-common/earn-staking-common';
import { returnStableArrayIfEmpty } from '@trezor/redux-utils';

import { useStakingProductInfo } from './useStakingProductInfo';

export const useStakingProductTargets = (
    productId: StakingProductId,
): readonly StakingProductTarget[] => {
    const { productInfo } = useStakingProductInfo(productId);

    const targets = productInfo?.targets;

    return returnStableArrayIfEmpty(targets);
};
