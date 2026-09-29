export const MAX_LATEST_AGE_SECONDS = 60;
// The host clock is only assumed honest, not precise; a block a few seconds "in the future" is
// clock skew, anything beyond that means the wall clock cannot be trusted for this job.
export const FUTURE_SKEW_SECONDS = 15;

export type FreshnessResult = { ok: true } | { ok: false; code: 'STALE_PROOF' | 'CLOCK_INVALID' };

export type CheckFreshnessParams = {
    timestampSeconds: bigint;
    nowMs: number;
};

export const checkFreshness = ({
    timestampSeconds,
    nowMs,
}: CheckFreshnessParams): FreshnessResult => {
    if (!Number.isFinite(nowMs) || nowMs <= 0) return { ok: false, code: 'CLOCK_INVALID' };
    const nowSeconds = BigInt(Math.floor(nowMs / 1000));
    if (timestampSeconds > nowSeconds + BigInt(FUTURE_SKEW_SECONDS)) {
        return { ok: false, code: 'CLOCK_INVALID' };
    }
    if (timestampSeconds + BigInt(MAX_LATEST_AGE_SECONDS) < nowSeconds) {
        return { ok: false, code: 'STALE_PROOF' };
    }

    return { ok: true };
};

// Lower bound the C verifier enforces for "latest" proofs: now - max age, never negative.
export const getMinLatestBlockTimestamp = (nowMs: number): bigint => {
    const lower = Math.floor(nowMs / 1000) - MAX_LATEST_AGE_SECONDS;

    return BigInt(lower > 0 ? lower : 0);
};

export const getExpiresAtMs = (timestampSeconds: bigint): number =>
    Number(timestampSeconds + BigInt(MAX_LATEST_AGE_SECONDS)) * 1000;
