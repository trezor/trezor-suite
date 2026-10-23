import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { buildClaimContract, buildClaimReviewForm } from './contracts/claimContract';
import { buildFreezeContract, buildFreezeReviewForm } from './contracts/freezeContract';
import { buildUnstakeContract, buildUnstakeReviewForm } from './contracts/unstakeContract';
import { buildVoteContract, buildVoteReviewForm } from './contracts/voteContract';
import { buildWithdrawContract, buildWithdrawReviewForm } from './contracts/withdrawContract';
import { tronStakingAdapter } from './tronStakingAdapter';
import { type TronStakingContract, type TronStakingStep } from './types';

const OWNER_ADDRESS = 'TVDGpn4hCSzJ5nkHPLetk8KQBtwaTppnkr';
const REPRESENTATIVE_A = 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9';
const REPRESENTATIVE_B = 'TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz4';

const account = {
    symbol: asNetworkSymbol('trx'),
    networkType: 'tron',
    descriptor: OWNER_ADDRESS,
    availableBalance: '1000000',
    misc: {},
} as unknown as Account;

const PAID_FEE = { fee: '345000', feePerByte: '1000', bytes: 345 };
const FREE_FEE = { fee: '0', feePerByte: '0', bytes: 280 };

const contractOf = (contract: TronStakingContract | null) => contract as TronStakingContract;

const freezeStep: TronStakingStep = {
    type: 'freeze',
    amount: '12.5',
    resourceType: 'energy',
    contract: contractOf(buildFreezeContract(account, '12.5', 'energy')),
    reviewForm: buildFreezeReviewForm('energy'),
};

const unstakeStep: TronStakingStep = {
    type: 'unstake',
    amount: '3',
    resourceType: 'bandwidth',
    contract: contractOf(buildUnstakeContract(account, '3', 'bandwidth')),
    reviewForm: buildUnstakeReviewForm('bandwidth'),
};

const voteAllocations = [
    { address: REPRESENTATIVE_A, count: 16 },
    { address: REPRESENTATIVE_B, count: 30 },
];

const voteStep: TronStakingStep = {
    type: 'vote',
    allocations: voteAllocations,
    contract: contractOf(buildVoteContract(account, voteAllocations)),
    reviewForm: buildVoteReviewForm(voteAllocations),
};

const withdrawStep: TronStakingStep = {
    type: 'withdraw',
    amount: '4',
    contract: contractOf(buildWithdrawContract(account)),
    reviewForm: buildWithdrawReviewForm(),
};

const claimStep: TronStakingStep = {
    type: 'claim',
    amount: '1.5',
    contract: contractOf(buildClaimContract(account)),
    reviewForm: buildClaimReviewForm(),
};

describe('Tron staking step transactions', () => {
    it('spends the frozen or unfrozen amount plus the fee', () => {
        expect(tronStakingAdapter.composeStepTransaction(freezeStep, account, PAID_FEE)).toEqual({
            type: 'final',
            totalSpent: '12845000',
            fee: '345000',
            feePerByte: '1000',
            bytes: 345,
            inputs: [],
            outputs: [{ address: OWNER_ADDRESS, amount: '12500000' }],
            outputsPermutation: [0],
        });
        expect(
            tronStakingAdapter.composeStepTransaction(unstakeStep, account, PAID_FEE),
        ).toMatchObject({
            totalSpent: '3345000',
            outputs: [{ address: OWNER_ADDRESS, amount: '3000000' }],
        });
    });

    it('sends a vote to each representative and spends only the fee', () => {
        expect(
            tronStakingAdapter.composeStepTransaction(voteStep, account, PAID_FEE),
        ).toMatchObject({
            totalSpent: '345000',
            outputs: [
                { address: REPRESENTATIVE_A, amount: '0' },
                { address: REPRESENTATIVE_B, amount: '0' },
            ],
            outputsPermutation: [0, 1],
        });
    });

    it('rejects a vote whose fee the available balance does not cover', () => {
        expect(
            tronStakingAdapter.composeStepTransaction(
                voteStep,
                { ...account, availableBalance: '1000' },
                PAID_FEE,
            ),
        ).toEqual({ type: 'error', error: 'AMOUNT_IS_NOT_ENOUGH' });
    });

    it('spends only the fee to withdraw or claim', () => {
        [withdrawStep, claimStep].forEach(step => {
            expect(
                tronStakingAdapter.composeStepTransaction(step, account, PAID_FEE),
            ).toMatchObject({
                totalSpent: '345000',
                outputs: [{ address: OWNER_ADDRESS, amount: '0' }],
            });
        });
    });
});

describe('Tron staking pending transactions', () => {
    it('describes a freeze and an unfreeze with their resource and amount', () => {
        expect(tronStakingAdapter.getPendingTransaction(freezeStep, account, FREE_FEE)).toEqual({
            amount: '0',
            type: 'self',
            target: { addresses: [OWNER_ADDRESS], amount: '12500000' },
            tronSpecific: {
                contractType: 'FreezeBalanceV2Contract',
                operation: 'freeze',
                resource: 'ENERGY',
                stakeAmount: '12500000',
                bandwidthUsage: '280',
            },
        });
        expect(tronStakingAdapter.getPendingTransaction(unstakeStep, account, PAID_FEE)).toEqual({
            amount: '0',
            type: 'self',
            target: { addresses: [OWNER_ADDRESS], amount: '3000000' },
            tronSpecific: {
                contractType: 'UnfreezeBalanceV2Contract',
                operation: 'unstake',
                resource: 'BANDWIDTH',
                unstakeAmount: '3000000',
                bandwidthUsage: undefined,
            },
        });
    });

    it('describes a vote by its representatives without bandwidth usage', () => {
        expect(tronStakingAdapter.getPendingTransaction(voteStep, account, FREE_FEE)).toEqual({
            amount: '0',
            type: 'self',
            target: { addresses: [REPRESENTATIVE_A, REPRESENTATIVE_B], amount: '0' },
            tronSpecific: {
                contractType: 'VoteWitnessContract',
                operation: 'vote',
                votes: [
                    { address: REPRESENTATIVE_A, count: '16' },
                    { address: REPRESENTATIVE_B, count: '30' },
                ],
            },
        });
    });

    it('describes a withdrawal and a claim by the TRX they return', () => {
        expect(tronStakingAdapter.getPendingTransaction(withdrawStep, account, FREE_FEE)).toEqual({
            amount: '0',
            type: 'self',
            target: { addresses: [OWNER_ADDRESS], amount: '4000000' },
            tronSpecific: {
                contractType: 'WithdrawExpireUnfreezeContract',
                operation: 'withdraw',
                bandwidthUsage: '280',
            },
        });
        expect(tronStakingAdapter.getPendingTransaction(claimStep, account, FREE_FEE)).toEqual({
            amount: '0',
            type: 'self',
            target: { addresses: [OWNER_ADDRESS], amount: '1500000' },
            tronSpecific: {
                contractType: 'WithdrawBalanceContract',
                operation: 'claim',
                bandwidthUsage: '280',
            },
        });
    });

    it('reports the transaction id of votes only', () => {
        expect(tronStakingAdapter.isTxidReportedBeforeBroadcast(voteStep)).toBe(true);
        [freezeStep, unstakeStep, withdrawStep, claimStep].forEach(step => {
            expect(tronStakingAdapter.isTxidReportedBeforeBroadcast(step)).toBe(false);
        });
    });
});
