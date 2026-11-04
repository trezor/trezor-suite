import {
    type GetAmountBoundsParams,
    StakingAdapterError,
    type StakingAmount,
    type StakingAmountBounds,
    type StakingProductLimits,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { EVERSTAKE_POOLED_LIMITS } from './everstakePooledDescriptor';

export const STAKING_OPERATION_NOT_SUPPORTED = 'operation-not-supported';

const ZERO_AMOUNT = stakingAmountSchema.parse('0');

const toStakingAmount = (value: BigNumber): StakingAmount =>
    stakingAmountSchema.parse(value.toFixed(0));

// The legacy getMaxStakeAmount formula: keep the fee buffer, or above the minimum balance keep
// only the withdrawal reserve, never more than the product maximum.
const getMaxStakeAmount = (balance: string, limits: StakingProductLimits): StakingAmount => {
    const balanceMinusFeeBuffer = BigNumber.max(
        new BigNumber(balance).minus(limits.feeBufferBalance),
        0,
    );
    const maxAmount = balanceMinusFeeBuffer.gt(limits.minBalanceForStaking)
        ? BigNumber.max(new BigNumber(balance).minus(limits.minWithdrawalAmount), 0)
        : balanceMinusFeeBuffer;

    return toStakingAmount(BigNumber.min(maxAmount, limits.maxStakeAmount));
};

export const getEverstakePooledAmountBounds = ({
    account,
    position,
    operation,
}: GetAmountBoundsParams): StakingAmountBounds => {
    switch (operation) {
        case 'stake':
            return {
                min: EVERSTAKE_POOLED_LIMITS.minStakeAmount,
                max: getMaxStakeAmount(account.balance, EVERSTAKE_POOLED_LIMITS),
            };
        case 'unstake':
            return { min: ZERO_AMOUNT, max: position?.balances.staked ?? ZERO_AMOUNT };
        case 'withdraw': {
            const withdrawable = position?.balances.withdrawable ?? ZERO_AMOUNT;

            return { min: withdrawable, max: withdrawable };
        }
        case 'claim':
        case 'vote':
        case 'redelegate':
            throw new StakingAdapterError(STAKING_OPERATION_NOT_SUPPORTED);
        default:
            return exhaustive(operation);
    }
};
