import type { StakingAccount } from '@suite-common/earn-staking-common';
import { mockStakingAccount } from '@suite-common/earn-staking-common/mocks';
import {
    MOCK_STAKING_NOW_SECONDS,
    MOCK_TRON_LUGANODES_SR,
    MOCK_TRON_P2P_ORG_SR,
    mockTronStakingAccount,
} from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { getParsedTronStakingInfo } from './utils';

type TronStakingInfo = NonNullable<
    NonNullable<NonNullable<StakingAccount['misc']>['tronResources']>['stakingInfo']
>;

const NOW_MS = MOCK_STAKING_NOW_SECONDS * 1000;

const mockTronAccount = (stakingInfo: Partial<TronStakingInfo>): StakingAccount => {
    const account = mockTronStakingAccount('votedLuganodes');
    const { tronResources } = account.misc;

    if (tronResources?.stakingInfo === undefined) {
        throw new Error('Expected the votedLuganodes fixture to carry staking info');
    }

    return {
        ...account,
        misc: {
            ...account.misc,
            tronResources: {
                ...tronResources,
                stakingInfo: { ...tronResources.stakingInfo, ...stakingInfo },
            },
        },
    };
};

describe('utils', () => {
    describe('getParsedTronStakingInfo', () => {
        it('reads the frozen balance, votes, rewards and resources in sun', () => {
            expect(
                getParsedTronStakingInfo({ account: mockTronStakingAccount('votedSplit') }),
            ).toEqual({
                frozen: '1000000000',
                staked: '1000000000',
                frozenByResource: { energy: '1000000000', bandwidth: '0' },
                delegatedByResource: { energy: '0', bandwidth: '0' },
                votingPower: '1000000000',
                unstakingBatches: [],
                votes: [
                    { address: MOCK_TRON_LUGANODES_SR, amount: '500000000' },
                    { address: MOCK_TRON_P2P_ORG_SR, amount: '500000000' },
                ],
                unallocatedVotingPower: '0',
                unclaimedReward: '1500000',
                rewardClaimAvailableAt: null,
            });
        });

        it('counts delegated TRX as staked next to the frozen balance', () => {
            expect(
                getParsedTronStakingInfo({
                    account: mockTronAccount({
                        stakedBalance: '600000000',
                        stakedBalanceEnergy: '600000000',
                        delegatedBalanceEnergy: '300000000',
                        delegatedBalanceBandwidth: '100000000',
                    }),
                }),
            ).toMatchObject({
                frozen: '600000000',
                staked: '1000000000',
                delegatedByResource: { energy: '300000000', bandwidth: '100000000' },
            });
        });

        it('reads the voting power in whole TRX', () => {
            expect(
                getParsedTronStakingInfo({
                    account: mockTronAccount({ totalVotingPower: '1000.5' }),
                })?.votingPower,
            ).toBe('1000000000');
        });

        it('reads the unfreeze batches with their expiry in milliseconds', () => {
            expect(
                getParsedTronStakingInfo({
                    account: mockTronStakingAccount('unstakingWithdrawable'),
                })?.unstakingBatches,
            ).toEqual([
                { amount: '300000000', availableAt: NOW_MS - 24 * 60 * 60 * 1000 },
                { amount: '200000000', availableAt: NOW_MS + 7 * 24 * 60 * 60 * 1000 },
            ]);
        });

        it('converts the unallocated voting power from TRX to sun', () => {
            expect(
                getParsedTronStakingInfo({ account: mockTronStakingAccount('frozenNotVoted') })
                    ?.unallocatedVotingPower,
            ).toBe('1000000000');
        });

        it('ends the claim cooldown a day after the last reward withdrawal', () => {
            expect(
                getParsedTronStakingInfo({ account: mockTronStakingAccount('rewardsOnCooldown') })
                    ?.rewardClaimAvailableAt,
            ).toBe(NOW_MS + 23 * 60 * 60 * 1000);
        });

        it('reads nothing from an account without staking info', () => {
            expect(
                getParsedTronStakingInfo({ account: mockTronStakingAccount('none') }),
            ).toBeNull();
            expect(
                getParsedTronStakingInfo({
                    account: mockStakingAccount({ symbol: asNetworkSymbol('trx') }),
                }),
            ).toBeNull();
        });

        it('leaves out a malformed vote and a malformed batch', () => {
            const stakingInfo = getParsedTronStakingInfo({
                account: mockTronAccount({
                    votes: [
                        { address: MOCK_TRON_LUGANODES_SR, voteCount: '600' },
                        { address: MOCK_TRON_P2P_ORG_SR, voteCount: 'many' },
                        { address: '', voteCount: '100' },
                        // @ts-expect-error Blockbook types the votes as objects.
                        null,
                    ],
                    unstakingBatches: [
                        { amount: '100000000', expireTime: MOCK_STAKING_NOW_SECONDS },
                        { amount: '-1', expireTime: MOCK_STAKING_NOW_SECONDS },
                        { amount: '100000000', expireTime: Number.NaN },
                        // @ts-expect-error Blockbook types the batches as objects.
                        null,
                    ],
                }),
            });

            expect(stakingInfo?.votes).toEqual([
                { address: MOCK_TRON_LUGANODES_SR, amount: '600000000' },
            ]);
            expect(stakingInfo?.unstakingBatches).toEqual([
                { amount: '100000000', availableAt: NOW_MS },
            ]);
        });

        it.each([
            { name: 'a hex address', address: '41a0e4d2b8c6f3c8e3b1d5b6f2a9c1e4d7b8a9c0d1' },
            { name: 'a broken checksum', address: `${MOCK_TRON_P2P_ORG_SR.slice(0, -1)}1` },
            { name: 'any other text', address: 'Luganodes' },
        ])('leaves out a vote for $name', ({ address }) => {
            expect(
                getParsedTronStakingInfo({
                    account: mockTronAccount({
                        votes: [
                            { address: MOCK_TRON_LUGANODES_SR, voteCount: '600' },
                            { address, voteCount: '400' },
                        ],
                    }),
                })?.votes,
            ).toEqual([{ address: MOCK_TRON_LUGANODES_SR, amount: '600000000' }]);
        });

        it('keeps the first vote for a repeated address', () => {
            expect(
                getParsedTronStakingInfo({
                    account: mockTronAccount({
                        votes: [
                            { address: MOCK_TRON_LUGANODES_SR, voteCount: '600' },
                            { address: MOCK_TRON_P2P_ORG_SR, voteCount: '300' },
                            { address: MOCK_TRON_LUGANODES_SR, voteCount: '100' },
                        ],
                    }),
                })?.votes,
            ).toEqual([
                { address: MOCK_TRON_LUGANODES_SR, amount: '600000000' },
                { address: MOCK_TRON_P2P_ORG_SR, amount: '300000000' },
            ]);
        });

        it('reads nothing from staking info with a malformed core amount', () => {
            expect(
                getParsedTronStakingInfo({ account: mockTronAccount({ unclaimedReward: '1.5' }) }),
            ).toBeNull();
            expect(
                getParsedTronStakingInfo({ account: mockTronAccount({ totalVotingPower: 'all' }) }),
            ).toBeNull();
            expect(
                getParsedTronStakingInfo({
                    account: mockTronAccount({ availableVotingPower: 'all' }),
                }),
            ).toBeNull();
        });

        it.each([
            { name: 'votes', stakingInfo: { votes: null } },
            { name: 'unstakingBatches', stakingInfo: { unstakingBatches: {} } },
        ])('reads nothing from staking info with malformed $name', ({ stakingInfo }) => {
            expect(
                // @ts-expect-error Blockbook types both lists as arrays.
                getParsedTronStakingInfo({ account: mockTronAccount(stakingInfo) }),
            ).toBeNull();
        });
    });
});
