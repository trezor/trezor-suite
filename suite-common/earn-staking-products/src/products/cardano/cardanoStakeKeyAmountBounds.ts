import type {
    StakingAmountBounds,
    StakingOperation,
    StakingPosition,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';

import { ZERO_STAKING_AMOUNT } from '../../utils/stakingAmounts';

export type CardanoStakeKeyOperation = Extract<StakingOperation, 'unstake' | 'claim' | 'vote'>;

export type GetCardanoStakeKeyAmountBoundsParams = {
    position: StakingPosition | null;
    operation: CardanoStakeKeyOperation;
};

// Deregistration and reward withdrawal take everything at once, and a DRep vote takes no amount.
export const getCardanoStakeKeyAmountBounds = ({
    position,
    operation,
}: GetCardanoStakeKeyAmountBoundsParams): StakingAmountBounds => {
    switch (operation) {
        case 'unstake': {
            const staked = position?.balances.staked ?? ZERO_STAKING_AMOUNT;

            return { min: staked, max: staked };
        }
        case 'claim': {
            const rewards = position?.balances.rewards ?? ZERO_STAKING_AMOUNT;

            return { min: rewards, max: rewards };
        }
        case 'vote':
            return { min: ZERO_STAKING_AMOUNT, max: ZERO_STAKING_AMOUNT };
        default:
            return exhaustive(operation);
    }
};
