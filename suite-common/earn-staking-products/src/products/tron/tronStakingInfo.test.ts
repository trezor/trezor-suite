import type { StakingAccount } from '@suite-common/earn-staking-common';
import { mockStakingAccount } from '@suite-common/earn-staking-common/mocks';
import {
    MOCK_STAKING_NOW_SECONDS,
    MOCK_TRON_LUGANODES_SR,
    MOCK_TRON_P2P_ORG_SR,
    mockTronStakingAccount,
} from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { parseTronStakingInfo } from './tronStakingInfo';

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

describe('parseTronStakingInfo', () => {
    it('reads the frozen balance, votes, rewards and resources in sun', () => {
        expect(parseTronStakingInfo(mockTronStakingAccount('votedSplit'))).toEqual({
            frozen: '1000000000',
            frozenByResource: { energy: '1000000000', bandwidth: '0' },
            delegatedByResource: { energy: '0', bandwidth: '0' },
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

    it('reads the unfreeze batches with their expiry in milliseconds', () => {
        expect(
            parseTronStakingInfo(mockTronStakingAccount('unstakingWithdrawable'))?.unstakingBatches,
        ).toEqual([
            { amount: '300000000', availableAt: NOW_MS - 24 * 60 * 60 * 1000 },
            { amount: '200000000', availableAt: NOW_MS + 7 * 24 * 60 * 60 * 1000 },
        ]);
    });

    it('converts the unallocated voting power from TRX to sun', () => {
        expect(
            parseTronStakingInfo(mockTronStakingAccount('frozenNotVoted'))?.unallocatedVotingPower,
        ).toBe('1000000000');
    });

    it('ends the claim cooldown a day after the last reward withdrawal', () => {
        expect(
            parseTronStakingInfo(mockTronStakingAccount('rewardsOnCooldown'))
                ?.rewardClaimAvailableAt,
        ).toBe(NOW_MS + 23 * 60 * 60 * 1000);
    });

    it('reads nothing from an account without staking info', () => {
        expect(parseTronStakingInfo(mockTronStakingAccount('none'))).toBeNull();
        expect(
            parseTronStakingInfo(mockStakingAccount({ symbol: asNetworkSymbol('trx') })),
        ).toBeNull();
    });

    it('leaves out a malformed vote and a malformed batch', () => {
        const stakingInfo = parseTronStakingInfo(
            mockTronAccount({
                votes: [
                    { address: MOCK_TRON_LUGANODES_SR, voteCount: '600' },
                    { address: MOCK_TRON_P2P_ORG_SR, voteCount: 'many' },
                    { address: '', voteCount: '100' },
                ],
                unstakingBatches: [
                    { amount: '100000000', expireTime: MOCK_STAKING_NOW_SECONDS },
                    { amount: '-1', expireTime: MOCK_STAKING_NOW_SECONDS },
                ],
            }),
        );

        expect(stakingInfo?.votes).toEqual([
            { address: MOCK_TRON_LUGANODES_SR, amount: '600000000' },
        ]);
        expect(stakingInfo?.unstakingBatches).toEqual([
            { amount: '100000000', availableAt: NOW_MS },
        ]);
    });

    it('reads nothing from staking info with a malformed core amount', () => {
        expect(parseTronStakingInfo(mockTronAccount({ unclaimedReward: '1.5' }))).toBeNull();
        expect(parseTronStakingInfo(mockTronAccount({ availableVotingPower: 'all' }))).toBeNull();
    });
});
