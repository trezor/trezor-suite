import {
    type GetAmountBoundsParams,
    StakingAdapterError,
    type StakingAmountBounds,
    type StakingProductAdapter,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';

import { SOLANA_NATIVE_DELEGATION_LIMITS } from './solanaDelegationDescriptors';
import { getMaxStakeAmount } from '../shared/getMaxStakeAmount';
import { ZERO_STAKING_AMOUNT } from '../shared/stakingAmounts';
import { STAKING_OPERATION_NOT_SUPPORTED } from '../shared/unimplementedStakingOperations';

export const getSolanaNativeDelegationAmountBounds = ({
    account,
    position,
    operation,
}: GetAmountBoundsParams): StakingAmountBounds => {
    switch (operation) {
        case 'stake':
            return {
                min: SOLANA_NATIVE_DELEGATION_LIMITS.minStakeAmount,
                max: getMaxStakeAmount(account.balance, SOLANA_NATIVE_DELEGATION_LIMITS),
            };
        case 'unstake':
            return {
                min: ZERO_STAKING_AMOUNT,
                max: position?.balances.staked ?? ZERO_STAKING_AMOUNT,
            };
        case 'withdraw': {
            const withdrawable = position?.balances.withdrawable ?? ZERO_STAKING_AMOUNT;

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

export const getSolanaExternalDelegationAmountBounds: StakingProductAdapter['getAmountBounds'] =
    () => {
        throw new StakingAdapterError(STAKING_OPERATION_NOT_SUPPORTED);
    };
