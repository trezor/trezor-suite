const SATOSHI_PER_BITCOIN = 100_000_000n;

const SATOSHI_PATTERN = /^\d+$/;

/**
 * Formats an amount in satoshi as bitcoin with all eight decimals, e.g. `0.00012345 BTC`.
 * Amounts shown on screen can come straight from the backend, so a malformed one is reported
 * as such instead of breaking the page.
 */
export const formatBitcoin = (satoshi: string | bigint) => {
    if (typeof satoshi === 'string' && !SATOSHI_PATTERN.test(satoshi)) return 'unknown amount';

    const amount = BigInt(satoshi);
    const whole = amount / SATOSHI_PER_BITCOIN;
    const fraction = (amount % SATOSHI_PER_BITCOIN).toString().padStart(8, '0');

    return `${whole}.${fraction} BTC`;
};

export const sumSatoshi = (amounts: readonly string[]) =>
    amounts.reduce((sum, amount) => sum + BigInt(amount), 0n);
