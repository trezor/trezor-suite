import {
    type GetAmountBoundsParams,
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
    type StakingAmountBounds,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';

import { SOLANA_EVERSTAKE_NATIVE_PRODUCT_LIMITS } from './limits';
import { getMaxStakeAmount } from '../../../utils/getMaxStakeAmount';
import { NO_STAKING_AMOUNT_BOUNDS, SMALLEST_STAKING_AMOUNT } from '../../../utils/stakingAmounts';

export const getSolanaEverstakeNativeProductAmountBounds = ({
    account,
    position,
    operation,
}: GetAmountBoundsParams): StakingAmountBounds => {
    switch (operation) {
        case 'stake':
            return {
                min: SOLANA_EVERSTAKE_NATIVE_PRODUCT_LIMITS.minStakeAmount,
                max: getMaxStakeAmount(account.balance, SOLANA_EVERSTAKE_NATIVE_PRODUCT_LIMITS),
            };
        case 'unstake':
            return position?.operations.includes('unstake')
                ? { min: SMALLEST_STAKING_AMOUNT, max: position.balances.staked }
                : NO_STAKING_AMOUNT_BOUNDS;
        case 'withdraw':
            return position?.operations.includes('withdraw')
                ? { min: position.balances.withdrawable, max: position.balances.withdrawable }
                : NO_STAKING_AMOUNT_BOUNDS;
        case 'claim':
        case 'vote':
        case 'redelegate':
            throw new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notSupported);
        default:
            return exhaustive(operation);
    }
};
