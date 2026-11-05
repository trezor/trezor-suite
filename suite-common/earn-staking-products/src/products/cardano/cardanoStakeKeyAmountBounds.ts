import type {
    StakingAmountBounds,
    StakingOperation,
    StakingPosition,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';

import { NO_STAKING_AMOUNT_BOUNDS, ZERO_STAKING_AMOUNT } from '../../utils/stakingAmounts';

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
    if (!position?.operations.includes(operation)) return NO_STAKING_AMOUNT_BOUNDS;

    switch (operation) {
        case 'unstake':
            return { min: position.balances.staked, max: position.balances.staked };
        case 'claim':
            return { min: position.balances.rewards, max: position.balances.rewards };
        case 'vote':
            return { min: ZERO_STAKING_AMOUNT, max: ZERO_STAKING_AMOUNT };
        default:
            return exhaustive(operation);
    }
};
