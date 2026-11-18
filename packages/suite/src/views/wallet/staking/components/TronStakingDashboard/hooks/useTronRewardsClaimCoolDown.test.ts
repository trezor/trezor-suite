import { act, renderHook } from '@testing-library/react';

import { useTronRewardsClaimCoolDown } from './useTronRewardsClaimCoolDown';

const NOW_MS = 1_700_000_000_000;

describe('useTronRewardsClaimCoolDown', () => {
    beforeEach(() => {
        // The repo defaults to legacy fake timers; `setSystemTime` needs the modern ones, and so
        // does advancing `Date.now()` alongside `useCountdownTimer`'s interval.
        jest.useFakeTimers({ legacyFakeTimers: false });
        jest.setSystemTime(NOW_MS);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('reports no cooldown when the position has none', () => {
        const { result } = renderHook(() => useTronRewardsClaimCoolDown(null));

        expect(result.current.isClaimOnCooldown).toBe(false);
        expect(result.current.claimCooldownEndsAt).toBe(null);
    });

    it('reports a cooldown until the position says the claim is available', () => {
        const { result } = renderHook(() => useTronRewardsClaimCoolDown(NOW_MS + 100_000));

        expect(result.current.isClaimOnCooldown).toBe(true);
        expect(result.current.claimCooldownEndsAt).toBe(NOW_MS + 100_000);
    });

    it('reports no cooldown once its end has passed', () => {
        const { result } = renderHook(() => useTronRewardsClaimCoolDown(NOW_MS - 1_000));

        expect(result.current.isClaimOnCooldown).toBe(false);
    });

    /**
     * The reason this hook exists: the position is synced again only later, so the Claim button
     * would stay disabled after the deadline until something unrelated changed the account.
     */
    it('clears the cooldown on its own when the deadline passes', () => {
        const { result } = renderHook(() => useTronRewardsClaimCoolDown(NOW_MS + 2_000));

        expect(result.current.isClaimOnCooldown).toBe(true);

        act(() => {
            jest.advanceTimersByTime(3_000);
        });

        expect(result.current.isClaimOnCooldown).toBe(false);
    });

    it('does not enable the claim before the deadline', () => {
        // `useCountdownTimer` defaults to `pastDeadlineLeadMs: 1000`, which would report the
        // deadline as passed a second early; the hook opts out of that lead.
        const { result } = renderHook(() => useTronRewardsClaimCoolDown(NOW_MS + 2_000));

        act(() => {
            jest.advanceTimersByTime(1_500);
        });

        expect(result.current.isClaimOnCooldown).toBe(true);
    });
});
