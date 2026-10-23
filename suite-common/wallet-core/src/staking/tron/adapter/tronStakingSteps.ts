import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type PrecomposedTransaction } from '@suite-common/wallet-types';
import { asAmountUnit, unitsToSubunits } from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import {
    type TronPendingStakingTransaction,
    type TronStakingStep,
    type TronStakingStepFee,
} from './types';

const toSun = (amount: string, symbol: NetworkSymbol) =>
    unitsToSubunits({ value: asAmountUnit(new BigNumber(amount)), symbol }).toString();

const toTronResource = (step: Extract<TronStakingStep, { resourceType: unknown }>) =>
    step.resourceType === 'energy' ? 'ENERGY' : 'BANDWIDTH';

// A staking transaction paid from free or staked bandwidth costs no TRX; the pending
// transaction shows the bandwidth it used instead.
const getBandwidthUsage = ({ fee, bytes }: TronStakingStepFee) =>
    new BigNumber(fee).isZero() ? String(bytes) : undefined;

export const composeTronStakingStepTransaction = (
    step: TronStakingStep,
    account: Account,
    { fee, feePerByte, bytes }: TronStakingStepFee,
): PrecomposedTransaction => {
    const composed = { type: 'final' as const, fee, feePerByte, bytes, inputs: [] };

    switch (step.type) {
        case 'freeze':
        case 'unstake': {
            const amountInSun = toSun(step.amount, account.symbol);

            return {
                ...composed,
                totalSpent: new BigNumber(amountInSun).plus(fee).toString(),
                outputs: [{ address: account.descriptor, amount: amountInSun }],
                outputsPermutation: [0],
            };
        }
        case 'vote':
            if (new BigNumber(account.availableBalance).lt(fee)) {
                return { type: 'error', error: 'AMOUNT_IS_NOT_ENOUGH' };
            }

            return {
                ...composed,
                totalSpent: fee,
                outputs: step.allocations.map(({ address }) => ({ address, amount: '0' })),
                outputsPermutation: step.allocations.map((_, index) => index),
            };
        case 'withdraw':
        case 'claim':
            return {
                ...composed,
                totalSpent: fee,
                outputs: [{ address: account.descriptor, amount: '0' }],
                outputsPermutation: [0],
            };
        default:
            return exhaustive(step);
    }
};

export const getTronStakingStepPendingTransaction = (
    step: TronStakingStep,
    account: Account,
    fee: TronStakingStepFee,
): TronPendingStakingTransaction => {
    const ownTarget = (amount: string) => ({ addresses: [account.descriptor], amount });
    const pending = { amount: '0', type: 'self' } as const;

    switch (step.type) {
        case 'freeze': {
            const stakeAmount = toSun(step.amount, account.symbol);

            return {
                ...pending,
                target: ownTarget(stakeAmount),
                tronSpecific: {
                    contractType: 'FreezeBalanceV2Contract',
                    operation: 'freeze',
                    resource: toTronResource(step),
                    stakeAmount,
                    bandwidthUsage: getBandwidthUsage(fee),
                },
            };
        }
        case 'unstake': {
            const unstakeAmount = toSun(step.amount, account.symbol);

            return {
                ...pending,
                target: ownTarget(unstakeAmount),
                tronSpecific: {
                    contractType: 'UnfreezeBalanceV2Contract',
                    operation: 'unstake',
                    resource: toTronResource(step),
                    unstakeAmount,
                    bandwidthUsage: getBandwidthUsage(fee),
                },
            };
        }
        case 'vote':
            return {
                ...pending,
                target: { addresses: step.allocations.map(({ address }) => address), amount: '0' },
                tronSpecific: {
                    contractType: 'VoteWitnessContract',
                    operation: 'vote',
                    votes: step.allocations.map(({ address, count }) => ({
                        address,
                        count: String(count),
                    })),
                },
            };
        case 'withdraw':
            return {
                ...pending,
                target: ownTarget(toSun(step.amount, account.symbol)),
                tronSpecific: {
                    contractType: 'WithdrawExpireUnfreezeContract',
                    operation: 'withdraw',
                    bandwidthUsage: getBandwidthUsage(fee),
                },
            };
        case 'claim':
            return {
                ...pending,
                target: ownTarget(toSun(step.amount, account.symbol)),
                tronSpecific: {
                    contractType: 'WithdrawBalanceContract',
                    operation: 'claim',
                    bandwidthUsage: getBandwidthUsage(fee),
                },
            };
        default:
            return exhaustive(step);
    }
};

// Votes are attributed to Suite through their transaction id, so it must be on record before
// the vote reaches the network.
export const isTronStakingTxidReportedBeforeBroadcast = (step: TronStakingStep) =>
    step.type === 'vote';
