import { useSelector } from 'react-redux';

import type { StakingProductId } from '@suite-common/earn-staking-common';

import {
    type ResolvedStakingProductAccess,
    type StakingAccessRootState,
    selectStakingProductAccess,
} from '../state/stakingAccessSelectors';

const NO_ACCESS: ResolvedStakingProductAccess = { access: 'hidden', operations: [], disabled: {} };

export const useStakingAccess = (
    productId: StakingProductId | null,
): ResolvedStakingProductAccess =>
    useSelector((state: StakingAccessRootState) =>
        productId === null ? NO_ACCESS : selectStakingProductAccess(state, productId),
    );
