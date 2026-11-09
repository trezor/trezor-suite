import type { StakingPosition, StakingPositionBalances } from '@suite-common/earn-staking-common';

import { isPositiveStakingAmount } from './stakingAmounts';

export type GetStakingPositionStatusParams = {
    balances: StakingPositionBalances;
};

export const getStakingPositionStatus = ({
    balances,
}: GetStakingPositionStatusParams): StakingPosition['status'] => {
    const { staked, pending, unstaking, withdrawable } = balances;

    if (isPositiveStakingAmount(staked)) {
        return 'active';
    }

    if (isPositiveStakingAmount(pending)) {
        return 'activating';
    }

    if (isPositiveStakingAmount(unstaking) || isPositiveStakingAmount(withdrawable)) {
        return 'deactivating';
    }

    return 'inactive';
};
