import type { StakingPosition, StakingPositionBalances } from '@suite-common/earn-staking-common';

import { isPositiveStakingAmount } from './stakingAmounts';

export type GetStakingPositionStatusParams = {
    balances: StakingPositionBalances;
};

export const getStakingPositionStatus = ({
    balances,
}: GetStakingPositionStatusParams): StakingPosition['status'] => {
    if (isPositiveStakingAmount(balances.staked)) return 'active';
    if (isPositiveStakingAmount(balances.pending)) return 'activating';

    if (
        isPositiveStakingAmount(balances.unstaking) ||
        isPositiveStakingAmount(balances.withdrawable)
    ) {
        return 'deactivating';
    }

    return 'inactive';
};
