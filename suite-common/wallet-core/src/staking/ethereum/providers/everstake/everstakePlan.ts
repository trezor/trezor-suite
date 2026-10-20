import { fromEther, fromWei } from '@suite-common/wallet-utils';
import { EVM_ABI } from '@trezor/network-ethereum-suite-common';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { WALLET_SDK_SOURCE } from '../../../shared/stakingConstants';
import {
    type StakingOperationRequest,
    type StakingPlanContext,
    type StakingPlanResult,
    type StakingStepContext,
    type StakingTxStep,
    type StakingUnstakePreviewParams,
} from '../types';
import {
    buildClaimWithdrawRequestData,
    buildStakeData,
    buildUnstakeData,
} from './everstakeCalldata';
import {
    MIN_ETH_AMOUNT_FOR_STAKING,
    STAKE_GAS_LIMIT_RESERVE,
    UNSTAKE_INTERCHANGES,
} from './everstakeConstants';
import { getEverstakeContractsBySymbol } from './everstakeContracts';
import {
    validateEverstakeClaimLiveState,
    validateEverstakeUnstakeLiveState,
} from './everstakeLiveState';
import { findEverstakeStakingPool } from './everstakePosition';
import { createEvmRead } from '../../../../evm/evmRead';
import { type EthereumStakingLiveStateReason } from '../../ethereumStakingLiveState';

const planned = (operation: StakingOperationRequest, step: StakingTxStep): StakingPlanResult => ({
    success: true,
    plan: { providerId: 'everstake', operation, steps: [step] },
});

const liveStateInvalid = (reason: EthereumStakingLiveStateReason): StakingPlanResult => ({
    success: false,
    error: { code: 'LIVE_STATE_INVALID', reason },
});

export const buildEverstakeStep = (
    request: StakingOperationRequest,
    { symbol, source }: StakingStepContext,
): StakingTxStep | null => {
    const contracts = getEverstakeContractsBySymbol(symbol);
    if (!contracts) return null;

    switch (request.type) {
        case 'stake':
            return {
                label: 'stake',
                to: contracts.pool,
                data: buildStakeData(source),
                value: fromEther(request.amount).toWei(),
                gasReserve: STAKE_GAS_LIMIT_RESERVE,
            };
        case 'unstake':
            return {
                label: 'unstake',
                to: contracts.pool,
                data: buildUnstakeData(
                    fromEther(request.amount).toWei(),
                    UNSTAKE_INTERCHANGES,
                    source,
                ),
                value: '0',
                gasReserve: STAKE_GAS_LIMIT_RESERVE,
            };
        case 'claim':
            return {
                label: 'claim',
                to: contracts.accounting,
                data: buildClaimWithdrawRequestData(),
                value: '0',
                gasReserve: STAKE_GAS_LIMIT_RESERVE,
            };
        default:
            return exhaustive(request);
    }
};

export const planEverstakeOperation = async (
    request: StakingOperationRequest,
    { account, source, readStakingPools }: StakingPlanContext,
): Promise<StakingPlanResult> => {
    const step = buildEverstakeStep(request, { symbol: account.symbol, source });
    if (!step) {
        return { success: false, error: { code: 'UNSUPPORTED_NETWORK' } };
    }

    switch (request.type) {
        case 'stake': {
            if (new BigNumber(request.amount).lt(MIN_ETH_AMOUNT_FOR_STAKING)) {
                return {
                    success: false,
                    error: {
                        code: 'AMOUNT_BELOW_MINIMUM',
                        minAmount: MIN_ETH_AMOUNT_FOR_STAKING.toString(),
                    },
                };
            }

            return planned(request, step);
        }
        case 'unstake': {
            const read = await readStakingPools();
            if (!read.success) {
                return liveStateInvalid({ code: 'ACCOUNT_INFO_FAILED', message: read.message });
            }

            const validation = validateEverstakeUnstakeLiveState(
                findEverstakeStakingPool(account.symbol, read.stakingPools),
                request.amount,
            );

            return validation.isValid
                ? planned(request, step)
                : liveStateInvalid(validation.reason);
        }
        case 'claim': {
            const read = await readStakingPools();
            if (!read.success) {
                return liveStateInvalid({ code: 'ACCOUNT_INFO_FAILED', message: read.message });
            }

            const validation = validateEverstakeClaimLiveState(
                findEverstakeStakingPool(account.symbol, read.stakingPools),
            );

            return validation.isValid
                ? planned(request, step)
                : liveStateInvalid(validation.reason);
        }
        default:
            return exhaustive(request);
    }
};

// Simulates the unstake call to learn how much of the amount the pool would release instantly
// from pending deposits.
export const previewEverstakeUnstake = async ({
    amount,
    from,
    symbol,
    source = WALLET_SDK_SOURCE,
}: StakingUnstakePreviewParams): Promise<string | null> => {
    if (!amount || !from || !symbol) return null;

    const contracts = getEverstakeContractsBySymbol(symbol);

    if (!contracts) return null;

    const amountWei = fromEther(amount).toWei();
    const data = buildUnstakeData(amountWei, UNSTAKE_INTERCHANGES, source);

    const read = createEvmRead({ symbol, from });
    const simulated = await read.one({
        to: contracts.pool,
        abi: EVM_ABI.everstake.unstake,
        functionName: 'unstake',
        data,
    });

    if (!simulated.success) {
        throw new Error(`Unstake preview failed: ${simulated.errorName}`);
    }

    return fromWei(simulated.value.toString()).toEther();
};
