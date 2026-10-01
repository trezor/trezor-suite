import { type Account } from '@suite-common/wallet-types';
import { type TronStakingInfo } from '@trezor/blockchain-link-types';
import * as tronUtils from '@trezor/network-tron/utils';

import {
    buildVoteContract,
    buildVoteReviewForm,
    getAllocatedVotesTotal,
    getCurrentVoteAllocations,
    splitVotesEvenly,
} from './voteContract';

const OWNER_ADDRESS = 'TVDGpn4hCSzJ5nkHPLetk8KQBtwaTppnkr';
const REPRESENTATIVE_A = 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9';
const REPRESENTATIVE_B = 'TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz4';
const INVALID_ADDRESS = 'TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz5';

const toHex = (address: string) => tronUtils.tronAddressToHex(address) as string;

const buildStakingInfo = (overrides: Partial<TronStakingInfo> = {}): TronStakingInfo => ({
    stakedBalance: '0',
    stakedBalanceEnergy: '0',
    stakedBalanceBandwidth: '0',
    unstakingBatches: [],
    totalVotingPower: '0',
    availableVotingPower: '0',
    votes: [],
    unclaimedReward: '0',
    latestWithdrawTime: 0,
    delegatedBalanceEnergy: '0',
    delegatedBalanceBandwidth: '0',
    ...overrides,
});

const buildTronAccount = (stakingInfo?: TronStakingInfo): Account =>
    ({
        symbol: 'trx',
        networkType: 'tron',
        descriptor: OWNER_ADDRESS,
        misc: { tronResources: { stakingInfo } },
    }) as unknown as Account;

describe('getCurrentVoteAllocations', () => {
    it('maps the current votes to allocations with numeric counts', () => {
        const account = buildTronAccount(
            buildStakingInfo({
                votes: [
                    { address: REPRESENTATIVE_A, voteCount: '16' },
                    { address: REPRESENTATIVE_B, voteCount: '15' },
                ],
            }),
        );

        expect(getCurrentVoteAllocations(account)).toEqual([
            { address: REPRESENTATIVE_A, count: 16 },
            { address: REPRESENTATIVE_B, count: 15 },
        ]);
    });

    it('leaves out votes with no counted power', () => {
        const account = buildTronAccount(
            buildStakingInfo({
                votes: [
                    { address: REPRESENTATIVE_A, voteCount: '0' },
                    { address: REPRESENTATIVE_B, voteCount: '5' },
                ],
            }),
        );

        expect(getCurrentVoteAllocations(account)).toEqual([
            { address: REPRESENTATIVE_B, count: 5 },
        ]);
    });

    it('returns no allocations when the staking info is missing', () => {
        expect(getCurrentVoteAllocations(buildTronAccount())).toEqual([]);
    });
});

describe('getAllocatedVotesTotal', () => {
    it('sums the votes across allocations', () => {
        expect(
            getAllocatedVotesTotal([
                { address: REPRESENTATIVE_A, count: 16 },
                { address: REPRESENTATIVE_B, count: 30 },
            ]),
        ).toBe(46);
    });

    it('is zero for no allocations', () => {
        expect(getAllocatedVotesTotal([])).toBe(0);
    });
});

describe('splitVotesEvenly', () => {
    it('splits the votes into whole shares, giving the remainder to the first shares', () => {
        expect(splitVotesEvenly({ votes: 46, shares: 3 })).toEqual([16, 15, 15]);
    });

    it('splits evenly divisible votes equally', () => {
        expect(splitVotesEvenly({ votes: 10, shares: 2 })).toEqual([5, 5]);
    });

    it('returns empty shares when there is nothing to split', () => {
        expect(splitVotesEvenly({ votes: 0, shares: 2 })).toEqual([0, 0]);
    });

    it('returns no shares when nobody receives them', () => {
        expect(splitVotesEvenly({ votes: 46, shares: 0 })).toEqual([]);
    });
});

describe('buildVoteContract', () => {
    it('builds one vote entry per allocation', () => {
        const contract = buildVoteContract(buildTronAccount(), [
            { address: REPRESENTATIVE_A, count: 16 },
            { address: REPRESENTATIVE_B, count: 30 },
        ]);

        expect(contract).toEqual({
            type: 'VoteWitnessContract',
            parameter: {
                value: {
                    owner_address: toHex(OWNER_ADDRESS),
                    votes: [
                        { address: toHex(REPRESENTATIVE_A), count: 16 },
                        { address: toHex(REPRESENTATIVE_B), count: 30 },
                    ],
                },
            },
        });
    });

    it('leaves out allocations with no votes', () => {
        const contract = buildVoteContract(buildTronAccount(), [
            { address: REPRESENTATIVE_A, count: 0 },
            { address: REPRESENTATIVE_B, count: 30 },
        ]);

        expect(contract?.parameter.value.votes).toEqual([
            { address: toHex(REPRESENTATIVE_B), count: 30 },
        ]);
    });

    it('returns null when there is nothing to vote with', () => {
        const account = buildTronAccount();

        expect(buildVoteContract(account, [])).toBeNull();
        expect(buildVoteContract(account, [{ address: REPRESENTATIVE_A, count: 0 }])).toBeNull();
    });

    it('returns null when a representative address is invalid', () => {
        expect(
            buildVoteContract(buildTronAccount(), [
                { address: REPRESENTATIVE_A, count: 16 },
                { address: INVALID_ADDRESS, count: 30 },
            ]),
        ).toBeNull();
    });
});

describe('buildVoteReviewForm', () => {
    it('carries the total and the per-representative votes for the review', () => {
        const form = buildVoteReviewForm([
            { address: REPRESENTATIVE_A, count: 16 },
            { address: REPRESENTATIVE_B, count: 30 },
        ]);

        expect(form.tronStaking).toEqual({
            kind: 'vote',
            votes: '46',
            allocations: [
                { address: REPRESENTATIVE_A, votes: '16' },
                { address: REPRESENTATIVE_B, votes: '30' },
            ],
        });
    });
});
