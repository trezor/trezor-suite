import { exhaustive } from '@trezor/type-utils';

import {
    type EthereumStakingLiveStateValidation,
    type EthereumStakingPoolLiveState,
    type ReadEthereumStakingPool,
    VALID_ETHEREUM_STAKING_LIVE_STATE,
    invalidEthereumStakingLiveState,
    weiToEtherBigNumber,
} from '../../ethereumStakingLiveState';
import { type StakingStepCalldata } from '../types';
import { getUnstakeAmountFromCalldata } from './everstakeCalldata';

export const validateEverstakeUnstakeLiveState = (
    stakingPool: EthereumStakingPoolLiveState | undefined,
    amount: string,
): EthereumStakingLiveStateValidation => {
    const { autocompoundBalance } = stakingPool ?? {};

    if (!autocompoundBalance) {
        return invalidEthereumStakingLiveState({ code: 'AUTOCOMPOUND_BALANCE_MISSING' });
    }

    const balance = weiToEtherBigNumber(autocompoundBalance);

    if (balance.lt(amount)) {
        return invalidEthereumStakingLiveState({
            code: 'MAX_AMOUNT_FOR_UNSTAKE',
            maxAmount: balance.toString(),
        });
    }

    return VALID_ETHEREUM_STAKING_LIVE_STATE;
};

export const validateEverstakeClaimLiveState = (
    stakingPool: EthereumStakingPoolLiveState | undefined,
): EthereumStakingLiveStateValidation => {
    const { withdrawTotalAmount, claimableAmount } = stakingPool ?? {};

    if (!withdrawTotalAmount || !claimableAmount) {
        return invalidEthereumStakingLiveState({ code: 'CLAIM_AMOUNTS_MISSING' });
    }

    const requested = weiToEtherBigNumber(withdrawTotalAmount);
    const readyForClaim = weiToEtherBigNumber(claimableAmount);

    if (requested.isZero()) {
        return invalidEthereumStakingLiveState({ code: 'NO_AMOUNT_REQUESTED_FOR_UNSTAKE' });
    }

    if (!readyForClaim.eq(requested)) {
        return invalidEthereumStakingLiveState({ code: 'UNSTAKE_REQUEST_NOT_FILLED' });
    }

    return VALID_ETHEREUM_STAKING_LIVE_STATE;
};

// Re-checks the pool state right before signing a step. Stake needs no chain read; unstake and
// claim read the pool once and validate against the amount carried by the calldata.
export const validateEverstakeStepLiveState = async (
    { label, data }: StakingStepCalldata,
    readStakingPool: ReadEthereumStakingPool,
): Promise<EthereumStakingLiveStateValidation> => {
    if (label === 'stake') {
        return VALID_ETHEREUM_STAKING_LIVE_STATE;
    }

    const read = await readStakingPool();

    if (!read.success) {
        return invalidEthereumStakingLiveState({
            code: 'ACCOUNT_INFO_FAILED',
            message: read.message,
        });
    }

    switch (label) {
        case 'unstake': {
            const amount = getUnstakeAmountFromCalldata(data);
            if (!amount) {
                return invalidEthereumStakingLiveState({ code: 'MISSING_UNSTAKE_AMOUNT' });
            }

            return validateEverstakeUnstakeLiveState(read.stakingPool, amount);
        }
        case 'claim':
            return validateEverstakeClaimLiveState(read.stakingPool);
        default:
            return exhaustive(label);
    }
};
