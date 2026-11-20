import type { StakingAmount, StakingProductLimits } from '@suite-common/earn-staking-common';
import { BigNumber } from '@trezor/utils';

import { toStakingAmount } from './stakingAmounts';

// The legacy getMaxStakeAmount formula: keep the fee buffer, or above the minimum
// balance keep only the withdrawal reserve, never more than the product maximum.
export const getMaxStakeAmount = (balance: string, limits: StakingProductLimits): StakingAmount => {
    const balanceMinusFeeBuffer = BigNumber.max(
        new BigNumber(balance).minus(limits.feeBufferBalance),
        0,
    );
    const maxAmount = balanceMinusFeeBuffer.gt(limits.minBalanceForStaking)
        ? BigNumber.max(new BigNumber(balance).minus(limits.minWithdrawalAmount), 0)
        : balanceMinusFeeBuffer;

    return toStakingAmount(BigNumber.min(maxAmount, limits.maxStakeAmount));
};
