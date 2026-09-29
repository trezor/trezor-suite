import { type Account } from '@suite-common/wallet-types';
import { type TronStakingInfo } from '@trezor/blockchain-link-types';
import * as tronUtils from '@trezor/network-tron/utils';

import {
    buildVoteContract,
    buildVoteReviewForm,
    getCurrentVoteAllocations,
    resolveVoteAllocations,
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

describe('resolveVoteAllocations', () => {
    describe('in the stake flow', () => {
        it('keeps the existing allocations and assigns only the available votes to a new representative', () => {
            const account = buildTronAccount(
                buildStakingInfo({
                    totalVotingPower: '46',
                    availableVotingPower: '30',
                    votes: [{ address: REPRESENTATIVE_A, voteCount: '16' }],
                }),
            );

            expect(
                resolveVoteAllocations({
                    account,
                    representativeAddress: REPRESENTATIVE_B,
                    flow: 'stake',
                }),
            ).toEqual([
                { address: REPRESENTATIVE_A, count: 16 },
                { address: REPRESENTATIVE_B, count: 30 },
            ]);
        });

        it('adds the available votes to a representative the account already votes for', () => {
            const account = buildTronAccount(
                buildStakingInfo({
                    totalVotingPower: '46',
                    availableVotingPower: '30',
                    votes: [{ address: REPRESENTATIVE_A, voteCount: '16' }],
                }),
            );

            expect(
                resolveVoteAllocations({
                    account,
                    representativeAddress: REPRESENTATIVE_A,
                    flow: 'stake',
                }),
            ).toEqual([{ address: REPRESENTATIVE_A, count: 46 }]);
        });

        it('assigns the whole available power when nothing has been voted yet', () => {
            const account = buildTronAccount(
                buildStakingInfo({ totalVotingPower: '46', availableVotingPower: '46' }),
            );

            expect(
                resolveVoteAllocations({
                    account,
                    representativeAddress: REPRESENTATIVE_A,
                    flow: 'stake',
                }),
            ).toEqual([{ address: REPRESENTATIVE_A, count: 46 }]);
        });

        it('returns the existing allocations untouched when no votes are available', () => {
            const account = buildTronAccount(
                buildStakingInfo({
                    totalVotingPower: '16',
                    availableVotingPower: '0',
                    votes: [{ address: REPRESENTATIVE_A, voteCount: '16' }],
                }),
            );

            expect(
                resolveVoteAllocations({
                    account,
                    representativeAddress: REPRESENTATIVE_B,
                    flow: 'stake',
                }),
            ).toEqual([{ address: REPRESENTATIVE_A, count: 16 }]);
        });
    });

    describe('in the standalone vote flow', () => {
        it('moves the entire voting power to the chosen representative', () => {
            const account = buildTronAccount(
                buildStakingInfo({
                    totalVotingPower: '46',
                    availableVotingPower: '0',
                    votes: [{ address: REPRESENTATIVE_A, voteCount: '46' }],
                }),
            );

            expect(
                resolveVoteAllocations({
                    account,
                    representativeAddress: REPRESENTATIVE_B,
                    flow: 'vote',
                }),
            ).toEqual([{ address: REPRESENTATIVE_B, count: 46 }]);
        });
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
