import { useSelector } from 'react-redux';

import type {
    StakingPosition,
    StakingPositionBalances,
    StakingProductDescriptor,
    StakingProductId,
} from '@suite-common/earn-staking-common';
import type { AccountKey } from '@suite-common/wallet-types';

import { useStakingAccess } from './useStakingAccess';
import {
    type ResolvedStakingProductAccess,
    type StakingAccessRootState,
    type StakingAccountProductRootState,
    selectStakingAccountProductDescriptor,
} from '../state/stakingAccessSelectors';
import { selectStakingAccountPositionEntry } from '../state/stakingAccountSelectors';
import type { StakingRootState } from '../state/stakingReducer';
import { selectStakingAccountTotals } from '../state/stakingSelectors';

export type StakingAccountPositionRootState = StakingAccountProductRootState &
    StakingAccessRootState;

export type StakingAccountPosition = {
    productId: StakingProductId | null;
    descriptor: StakingProductDescriptor | null;
    position: StakingPosition | null;
    totals: StakingPositionBalances;
    access: ResolvedStakingProductAccess;
};

// The account's counted position with its product, totals and access. Without a position, the
// product is the one the network stakes on, so a screen can still offer the first stake.
export const useStakingAccountPosition = (accountKey: AccountKey): StakingAccountPosition => {
    const descriptor = useSelector((state: StakingAccountProductRootState) =>
        selectStakingAccountProductDescriptor(state, accountKey),
    );
    const position = useSelector(
        (state: StakingRootState) =>
            selectStakingAccountPositionEntry(state, accountKey)?.position ?? null,
    );
    const totals = useSelector((state: StakingRootState) =>
        selectStakingAccountTotals(state, accountKey),
    );
    const productId = descriptor?.id ?? null;
    const access = useStakingAccess(productId);

    return { productId, descriptor, position, totals, access };
};
