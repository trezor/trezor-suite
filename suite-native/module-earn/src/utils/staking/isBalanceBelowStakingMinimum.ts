import { type StakingProductLimits } from '@suite-common/earn-staking-common';
import { BigNumber } from '@trezor/utils';

export type IsBalanceBelowStakingMinimumParams = {
    availableBalance: string;
    limits: StakingProductLimits | null;
};

// A stake needs the minimum amount and the fee buffer on top, as the legacy limits summed them.
export const isBalanceBelowStakingMinimum = ({
    availableBalance,
    limits,
}: IsBalanceBelowStakingMinimumParams): boolean =>
    limits !== null &&
    new BigNumber(availableBalance).lt(
        new BigNumber(limits.minStakeAmount).plus(limits.feeBufferBalance),
    );
