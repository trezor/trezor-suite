import { checkFreshness, getExpiresAtMs, getMinLatestBlockTimestamp } from './freshness';

describe('checkFreshness', () => {
    const timestampSeconds = 1000n;

    it('accepts a block inside the age window', () => {
        expect(checkFreshness({ timestampSeconds, nowMs: 1_030_000 })).toEqual({ ok: true });
        expect(checkFreshness({ timestampSeconds, nowMs: 1_060_999 })).toEqual({ ok: true });
    });

    it('rejects a block older than the window as stale', () => {
        expect(checkFreshness({ timestampSeconds, nowMs: 1_061_000 })).toEqual({
            ok: false,
            code: 'STALE_PROOF',
        });
    });

    it('tolerates small clock skew but not a block from the future', () => {
        expect(checkFreshness({ timestampSeconds, nowMs: 990_000 })).toEqual({ ok: true });
        expect(checkFreshness({ timestampSeconds, nowMs: 984_000 })).toEqual({
            ok: false,
            code: 'CLOCK_INVALID',
        });
    });

    it('rejects an implausible host clock', () => {
        expect(checkFreshness({ timestampSeconds, nowMs: 0 })).toEqual({
            ok: false,
            code: 'CLOCK_INVALID',
        });
        expect(checkFreshness({ timestampSeconds, nowMs: Number.NaN })).toEqual({
            ok: false,
            code: 'CLOCK_INVALID',
        });
    });
});

describe('window helpers', () => {
    it('derives the verifier lower bound from the wall clock', () => {
        expect(getMinLatestBlockTimestamp(1_030_000)).toBe(970n);
        expect(getMinLatestBlockTimestamp(10_000)).toBe(0n);
    });

    it('expires a result when the authenticated timestamp leaves the window', () => {
        expect(getExpiresAtMs(1000n)).toBe(1_060_000);
    });
});
