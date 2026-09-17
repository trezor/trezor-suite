import { act, renderHook } from '@testing-library/react';

import { TRON_REWARD_CLAIM_COOLDOWN_SECONDS } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { type TronStakingInfo } from '@trezor/blockchain-link-types';

import { useTronRewardsClaimCoolDown } from './useTronRewardsClaimCoolDown';

const NOW_SECONDS = 1_700_000_000;

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
        formattedBalance: '0',
        misc: { tronResources: { stakingInfo } },
    }) as unknown as Account;

describe('useTronRewardsClaimCoolDown', () => {
    beforeEach(() => {
        // The repo defaults to legacy fake timers; `setSystemTime` needs the modern ones, and so
        // does advancing `Date.now()` alongside `useCountdownTimer`'s interval.
        jest.useFakeTimers({ legacyFakeTimers: false });
        jest.setSystemTime(NOW_SECONDS * 1000);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('reports no cooldown when there is no stakingInfo', () => {
        const { result } = renderHook(() => useTronRewardsClaimCoolDown(buildTronAccount()));

        expect(result.current.isClaimOnCooldown).toBe(false);
        expect(result.current.claimCooldownEndsAt).toBe(null);
    });

    it('reports no cooldown when rewards were never withdrawn', () => {
        const account = buildTronAccount(buildStakingInfo({ latestWithdrawTime: 0 }));

        const { result } = renderHook(() => useTronRewardsClaimCoolDown(account));

        expect(result.current.isClaimOnCooldown).toBe(false);
        expect(result.current.claimCooldownEndsAt).toBe(null);
    });

    it('reports a cooldown within 24h of the last withdrawal', () => {
        const account = buildTronAccount(
            buildStakingInfo({ latestWithdrawTime: NOW_SECONDS - 100 }),
        );

        const { result } = renderHook(() => useTronRewardsClaimCoolDown(account));

        expect(result.current.isClaimOnCooldown).toBe(true);
        expect(result.current.claimCooldownEndsAt).toBe(
            NOW_SECONDS - 100 + TRON_REWARD_CLAIM_COOLDOWN_SECONDS,
        );
    });

    it('reports no cooldown once the 24h cooldown has passed', () => {
        const account = buildTronAccount(
            buildStakingInfo({
                latestWithdrawTime: NOW_SECONDS - TRON_REWARD_CLAIM_COOLDOWN_SECONDS - 1,
            }),
        );

        const { result } = renderHook(() => useTronRewardsClaimCoolDown(account));

        expect(result.current.isClaimOnCooldown).toBe(false);
    });

    /**
     * The reason this hook exists. `isTronRewardClaimOnCooldown` read the wall clock inside a
     * helper, so the React Compiler cached the answer on `account` and the Claim button stayed
     * disabled after the deadline until something unrelated changed the account object. Note that
     * `account` is deliberately the same object throughout.
     */
    it('clears the cooldown on its own when the deadline passes, with no account change', () => {
        const account = buildTronAccount(
            buildStakingInfo({
                latestWithdrawTime: NOW_SECONDS - TRON_REWARD_CLAIM_COOLDOWN_SECONDS + 2,
            }),
        );

        const { result } = renderHook(() => useTronRewardsClaimCoolDown(account));

        expect(result.current.isClaimOnCooldown).toBe(true);

        act(() => {
            jest.advanceTimersByTime(3_000);
        });

        expect(result.current.isClaimOnCooldown).toBe(false);
    });

    it('does not enable the claim before the deadline', () => {
        // `useCountdownTimer` defaults to `pastDeadlineLeadMs: 1000`, which would report the
        // deadline as passed a second early; the hook opts out of that lead.
        const account = buildTronAccount(
            buildStakingInfo({
                latestWithdrawTime: NOW_SECONDS - TRON_REWARD_CLAIM_COOLDOWN_SECONDS + 2,
            }),
        );

        const { result } = renderHook(() => useTronRewardsClaimCoolDown(account));

        act(() => {
            jest.advanceTimersByTime(1_500);
        });

        expect(result.current.isClaimOnCooldown).toBe(true);
    });
});
