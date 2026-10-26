import type { AccountWithNetworkType } from '@suite-common/wallet-types';
import {
    MOCK_STAKING_NOW_SECONDS,
    MOCK_TRON_EXTERNAL_SR,
    MOCK_TRON_LUGANODES_SR,
    MOCK_TRON_P2P_ORG_SR,
    type TronStakingScenario,
    mockTronStakingAccount,
} from '@suite-common/wallet-types/mocks';

import {
    selectTronAvailableVotingPowerByAccountKey,
    selectTronPendingUnstakeBalanceByAccountKey,
    selectTronTotalVotingPowerByAccountKey,
    selectTronUnstakingBatchesByAccountKey,
    selectTronVotesByAccountKey,
} from './tronStakingSelectors';
import {
    getTronPendingUnstakingBatches,
    getTronRewardClaimCooldownEndsAt,
    getTronStakingRewards,
    getTronWithdrawableBalance,
    isTronStakingActive,
} from './tronStakingUtils';
import { mockStakeRootState, mockTronUnfreezeTransaction } from '../../../mocks';
import type { StakeRootState } from '../stakingReducerTypes';

const SECONDS_IN_DAY = 24 * 60 * 60;

const readTronStakingDetails = (
    account: AccountWithNetworkType<'tron'>,
    state: StakeRootState = mockStakeRootState({ accounts: [account] }),
) => {
    const unstakingBatches = selectTronUnstakingBatchesByAccountKey(state, account.key);

    return {
        isActive: isTronStakingActive(account),
        votes: selectTronVotesByAccountKey(state, account.key),
        totalVotingPower: selectTronTotalVotingPowerByAccountKey(state, account.key),
        availableVotingPower: selectTronAvailableVotingPowerByAccountKey(state, account.key),
        rewards: getTronStakingRewards(account),
        rewardClaimCooldownEndsAt: getTronRewardClaimCooldownEndsAt(account),
        withdrawableBalance: getTronWithdrawableBalance(account),
        pendingUnstakeBalance: selectTronPendingUnstakeBalanceByAccountKey(state, account.key),
        unstakingBatches,
        pendingUnstakingBatches: getTronPendingUnstakingBatches({
            batches: unstakingBatches,
            symbol: account.symbol,
        }),
    };
};

type TronStakingDetails = ReturnType<typeof readTronStakingDetails>;

const LUGANODES_VOTED_DETAILS: TronStakingDetails = {
    isActive: true,
    votes: [{ address: MOCK_TRON_LUGANODES_SR, voteCount: '1000' }],
    totalVotingPower: '1000',
    availableVotingPower: '0',
    rewards: '1.5',
    rewardClaimCooldownEndsAt: null,
    withdrawableBalance: '0',
    pendingUnstakeBalance: '0',
    unstakingBatches: [],
    pendingUnstakingBatches: [],
};

const PARTIALLY_UNSTAKED_DETAILS: TronStakingDetails = {
    ...LUGANODES_VOTED_DETAILS,
    votes: [{ address: MOCK_TRON_LUGANODES_SR, voteCount: '500' }],
    totalVotingPower: '500',
    pendingUnstakeBalance: '200',
    pendingUnstakingBatches: [{ amount: '200', daysLocked: 7, resource: undefined }],
};

describe('tron staking details characterization', () => {
    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(MOCK_STAKING_NOW_SECONDS * 1000);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it.each<{ scenario: TronStakingScenario; expected: TronStakingDetails }>([
        {
            scenario: 'none',
            expected: {
                ...LUGANODES_VOTED_DETAILS,
                isActive: false,
                votes: [],
                totalVotingPower: '0',
                rewards: '0',
            },
        },
        {
            scenario: 'frozenNotVoted',
            expected: {
                ...LUGANODES_VOTED_DETAILS,
                votes: [],
                availableVotingPower: '1000',
                rewards: '0',
            },
        },
        { scenario: 'votedLuganodes', expected: LUGANODES_VOTED_DETAILS },
        {
            scenario: 'votedSplit',
            expected: {
                ...LUGANODES_VOTED_DETAILS,
                votes: [
                    { address: MOCK_TRON_LUGANODES_SR, voteCount: '500' },
                    { address: MOCK_TRON_P2P_ORG_SR, voteCount: '500' },
                ],
            },
        },
        {
            scenario: 'votedExternal',
            expected: {
                ...LUGANODES_VOTED_DETAILS,
                votes: [{ address: MOCK_TRON_EXTERNAL_SR, voteCount: '1000' }],
            },
        },
        {
            scenario: 'unstakingPending',
            expected: {
                ...PARTIALLY_UNSTAKED_DETAILS,
                unstakingBatches: [
                    {
                        amount: '200000000',
                        expireTime: MOCK_STAKING_NOW_SECONDS + 7 * SECONDS_IN_DAY,
                        resource: undefined,
                    },
                ],
            },
        },
        {
            scenario: 'unstakingWithdrawable',
            expected: {
                ...PARTIALLY_UNSTAKED_DETAILS,
                withdrawableBalance: '300',
                unstakingBatches: [
                    {
                        amount: '300000000',
                        expireTime: MOCK_STAKING_NOW_SECONDS - SECONDS_IN_DAY,
                        resource: undefined,
                    },
                    {
                        amount: '200000000',
                        expireTime: MOCK_STAKING_NOW_SECONDS + 7 * SECONDS_IN_DAY,
                        resource: undefined,
                    },
                ],
            },
        },
        {
            scenario: 'rewardsOnCooldown',
            expected: {
                ...LUGANODES_VOTED_DETAILS,
                rewards: '2',
                rewardClaimCooldownEndsAt: MOCK_STAKING_NOW_SECONDS + 23 * 60 * 60,
            },
        },
    ])('$scenario', ({ scenario, expected }) => {
        expect(readTronStakingDetails(mockTronStakingAccount(scenario))).toEqual(expected);
    });

    it('matches unstaking batches to unfreeze transactions to resolve their resource', () => {
        const account = mockTronStakingAccount('unstakingWithdrawable');
        const state = mockStakeRootState({
            accounts: [account],
            transactions: {
                [account.key]: [
                    mockTronUnfreezeTransaction({
                        account,
                        unstakeAmount: '300000000',
                        blockTime: MOCK_STAKING_NOW_SECONDS - 15 * SECONDS_IN_DAY,
                        resource: 'energy',
                    }),
                    mockTronUnfreezeTransaction({
                        account,
                        unstakeAmount: '200000000',
                        blockTime: MOCK_STAKING_NOW_SECONDS - 7 * SECONDS_IN_DAY,
                    }),
                ],
            },
        });

        const { unstakingBatches, pendingUnstakingBatches } = readTronStakingDetails(
            account,
            state,
        );

        expect({ unstakingBatches, pendingUnstakingBatches }).toEqual({
            unstakingBatches: [
                {
                    amount: '300000000',
                    expireTime: MOCK_STAKING_NOW_SECONDS - SECONDS_IN_DAY,
                    resource: 'energy',
                },
                {
                    amount: '200000000',
                    expireTime: MOCK_STAKING_NOW_SECONDS + 7 * SECONDS_IN_DAY,
                    resource: 'bandwidth',
                },
            ],
            pendingUnstakingBatches: [{ amount: '200', daysLocked: 7, resource: 'bandwidth' }],
        });
    });
});
