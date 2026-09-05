import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    areSolanaRewardsNotAvailableYet,
    getSolanaRewardsSyncStatus,
    hasActiveSolanaStakingAccount,
} from './solanaRewardsUtils';
import { type SolRewardsHistoryRewardsItem } from '../../api/types';

type SolanaAccountMisc = Extract<Account, { networkType: 'solana' }>['misc'];

const mockSolanaAccount = (misc: SolanaAccountMisc): Account => {
    const account = mockWalletAccount({ symbol: asNetworkSymbol('sol') });

    if (account.networkType !== 'solana') {
        throw new Error('Expected a solana account mock.');
    }

    return { ...account, misc };
};

const mockReward = (
    reward: Partial<SolRewardsHistoryRewardsItem>,
): SolRewardsHistoryRewardsItem => ({
    epoch: 1024,
    delegator: 'delegator-address',
    amount: '318354',
    currency: 'SOL',
    time: '2026-08-30T05:31:04Z',
    ...reward,
});

const activeStakingMisc = (solEpoch: number, activationEpoch?: number): SolanaAccountMisc => ({
    solEpoch,
    solStakingAccounts: [{ status: 'active', rentExemptReserve: '2282880', activationEpoch }],
});

const inactiveStakingMisc = (solEpoch: number): SolanaAccountMisc => ({
    solEpoch,
    solStakingAccounts: [{ status: 'inactive', rentExemptReserve: '2282880' }],
});

describe('hasActiveSolanaStakingAccount', () => {
    it('returns true only when at least one staking account is active', () => {
        expect(hasActiveSolanaStakingAccount(mockSolanaAccount(activeStakingMisc(1027)))).toBe(
            true,
        );
        expect(hasActiveSolanaStakingAccount(mockSolanaAccount(inactiveStakingMisc(1027)))).toBe(
            false,
        );
        expect(hasActiveSolanaStakingAccount(mockSolanaAccount({ solEpoch: 1027 }))).toBe(false);
    });

    it('returns false for a non-solana account', () => {
        expect(hasActiveSolanaStakingAccount(mockWalletAccount({ symbol: 'btc' }))).toBe(false);
    });
});

describe('areSolanaRewardsNotAvailableYet', () => {
    it('returns true when the latest reward lags behind the previous epoch', () => {
        const account = mockSolanaAccount(activeStakingMisc(1027));

        expect(areSolanaRewardsNotAvailableYet(account, [mockReward({ epoch: 1024 })])).toBe(true);
    });

    it('returns false when the latest reward is for the previous epoch', () => {
        const account = mockSolanaAccount(activeStakingMisc(1027));

        expect(areSolanaRewardsNotAvailableYet(account, [mockReward({ epoch: 1026 })])).toBe(false);
    });

    it('returns false without an active staking account', () => {
        const account = mockSolanaAccount(inactiveStakingMisc(1027));

        expect(areSolanaRewardsNotAvailableYet(account, [mockReward({ epoch: 1024 })])).toBe(false);
    });
});

describe('getSolanaRewardsSyncStatus', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date('2026-09-02T06:01:43Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('is out of sync when the latest reward is more than two epochs behind', () => {
        const account = mockSolanaAccount(activeStakingMisc(1027));

        expect(
            getSolanaRewardsSyncStatus(account, [
                mockReward({ epoch: 1024, time: '2026-08-30T05:31:04Z' }),
            ]),
        ).toEqual({
            isOutOfSync: true,
            activeEpoch: 1027,
            latestRewardEpoch: 1024,
            epochsSinceLatestReward: 3,
            hoursSinceLatestReward: 73,
        });
    });

    it('tolerates the latest reward being up to two epochs behind', () => {
        const account = mockSolanaAccount(activeStakingMisc(1027));

        expect(getSolanaRewardsSyncStatus(account, [mockReward({ epoch: 1026 })]).isOutOfSync).toBe(
            false,
        );
        expect(getSolanaRewardsSyncStatus(account, [mockReward({ epoch: 1025 })]).isOutOfSync).toBe(
            false,
        );
    });

    it('is not out of sync when a tolerated epoch lag lasts longer than the usual epoch duration', () => {
        const account = mockSolanaAccount(activeStakingMisc(1026));

        // The latest reward is 55 hours old (a long epoch), but only one epoch behind.
        const status = getSolanaRewardsSyncStatus(account, [
            mockReward({ epoch: 1025, time: '2026-08-30T23:01:43Z' }),
        ]);

        expect(status.isOutOfSync).toBe(false);
        expect(status.hoursSinceLatestReward).toBe(55);
    });

    it('is not out of sync when a restaked account only has rewards from its previous staking cycle', () => {
        // The stake activated in epoch 1025 earns its first reward for epoch 1026,
        // so the old-cycle reward from epoch 1010 is not a sign of stale API data.
        const account = mockSolanaAccount(activeStakingMisc(1027, 1025));

        const status = getSolanaRewardsSyncStatus(account, [mockReward({ epoch: 1010 })]);

        expect(status.isOutOfSync).toBe(false);
        expect(status.oldestActiveStakeActivationEpoch).toBe(1025);
    });

    it('is out of sync when even the first reward of a restaked cycle is more than two epochs late', () => {
        const account = mockSolanaAccount(activeStakingMisc(1027, 1023));

        expect(getSolanaRewardsSyncStatus(account, [mockReward({ epoch: 1010 })]).isOutOfSync).toBe(
            true,
        );
    });

    it('is not out of sync without an active staking account', () => {
        const account = mockSolanaAccount(inactiveStakingMisc(1027));

        expect(getSolanaRewardsSyncStatus(account, [mockReward({ epoch: 1024 })]).isOutOfSync).toBe(
            false,
        );
    });

    it('reports an out-of-sync epoch lag even when the latest reward time is missing or invalid', () => {
        const account = mockSolanaAccount(activeStakingMisc(1027));

        const status = getSolanaRewardsSyncStatus(account, [mockReward({ epoch: 1024, time: '' })]);

        expect(status.isOutOfSync).toBe(true);
        expect(status.hoursSinceLatestReward).toBeUndefined();

        expect(
            getSolanaRewardsSyncStatus(account, [mockReward({ epoch: 1024, time: 'not-a-date' })])
                .isOutOfSync,
        ).toBe(true);
    });

    it('is not out of sync when the epoch or rewards data is incomplete', () => {
        const accountWithoutEpoch = mockSolanaAccount({
            solStakingAccounts: [{ status: 'active', rentExemptReserve: '2282880' }],
        });
        const account = mockSolanaAccount(activeStakingMisc(1027));

        expect(getSolanaRewardsSyncStatus(accountWithoutEpoch, [mockReward({})]).isOutOfSync).toBe(
            false,
        );
        expect(getSolanaRewardsSyncStatus(account, []).isOutOfSync).toBe(false);
    });

    it('is not out of sync for a non-solana account', () => {
        expect(
            getSolanaRewardsSyncStatus(mockWalletAccount({ symbol: 'btc' }), [mockReward({})])
                .isOutOfSync,
        ).toBe(false);
    });
});
