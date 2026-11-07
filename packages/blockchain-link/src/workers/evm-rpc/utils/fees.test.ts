import { type PublicClient } from 'viem';

import { calculateEip1559Fees } from './fees';

const createClient = ({
    maxPriorityFeePerGas,
    baseFeePerGas,
    reward,
    blockTimeMs = 2000,
}: {
    maxPriorityFeePerGas: bigint;
    baseFeePerGas: bigint[];
    reward: bigint[][];
    blockTimeMs?: number | null;
}) => {
    const client = {
        request: jest.fn().mockResolvedValue(`0x${maxPriorityFeePerGas.toString(16)}`),
        getFeeHistory: jest.fn().mockResolvedValue({
            baseFeePerGas,
            reward,
        }),
        getBlock: jest.fn().mockImplementation(({ blockNumber }: { blockNumber?: bigint }) =>
            blockTimeMs === null
                ? Promise.reject(new Error('no block time'))
                : Promise.resolve({
                      number: blockNumber ?? 100n,
                      timestamp: blockNumber === undefined ? 1000n : 1000n - BigInt(blockTimeMs),
                  }),
        ),
    };

    return client as unknown as PublicClient;
};

// Requires both fields to actually be present, so an empty/malformed tier
// object fails the check instead of silently comparing 0n >= 0n.
const invariantHolds = (tier: { maxFeePerGas?: string; maxPriorityFeePerGas?: string }) => {
    if (tier.maxFeePerGas === undefined || tier.maxPriorityFeePerGas === undefined) {
        return false;
    }

    return BigInt(tier.maxFeePerGas) >= BigInt(tier.maxPriorityFeePerGas);
};

describe(calculateEip1559Fees.name, () => {
    // Regression: on Optimism, the node's eth_maxPriorityFeePerGas suggestion has
    // been observed at 69x the feeHistory-derived average reward for the same
    // block - a real divergence between two unrelated data sources, not a
    // contrived edge case.
    it('never lets a tip exceed its own cap when the two fee sources wildly diverge (Optimism-shaped input)', async () => {
        const client = createClient({
            maxPriorityFeePerGas: 1_000_000n, // eth_maxPriorityFeePerGas, doubled for medium = 2_000_000
            baseFeePerGas: [3905n, 3907n, 3903n, 3902n, 3903n],
            reward: [
                [1n, 592515n, 5000000n, 100000000n],
                [1n, 11n, 72432n, 3800296n],
                [1n, 50000n, 15966209n, 43810653n],
                [1n, 11098n, 5000000n, 5000000n],
            ],
        });

        const fees = await calculateEip1559Fees(client);

        expect(fees).toBeDefined();
        expect(invariantHolds(fees!.low!)).toBe(true);
        expect(invariantHolds(fees!.medium!)).toBe(true);
        expect(invariantHolds(fees!.high!)).toBe(true);
        expect(invariantHolds(fees!.instant!)).toBe(true);

        // The old implementation set medium.maxPriorityFeePerGas = 2_000_000, but
        // medium.maxFeePerGas (baseFee + avg 70th-percentile reward) came out far
        // below that - reproduce the exact old-code numbers to document the bug
        // this test guards against.
        const oldMediumCap = 3902n + (592515n + 11n + 50000n + 11098n) / 4n; // 167308
        const oldMediumTip = 1_000_000n * 2n; // 2_000_000
        expect(oldMediumTip).toBeGreaterThan(oldMediumCap); // sanity: the bug is real
        expect(BigInt(fees!.medium!.maxPriorityFeePerGas!)).toBe(oldMediumTip); // tip unchanged
        expect(BigInt(fees!.medium!.maxFeePerGas!)).toBeGreaterThanOrEqual(oldMediumTip); // cap now covers it
    });

    it('holds the invariant on a well-behaved chain where the two sources roughly agree', async () => {
        const client = createClient({
            maxPriorityFeePerGas: 1_500_000_000n,
            baseFeePerGas: [
                20_000_000_000n,
                21_000_000_000n,
                19_500_000_000n,
                20_500_000_000n,
                21_000_000_000n,
            ],
            reward: [
                [1_000_000_000n, 1_400_000_000n, 2_000_000_000n, 3_000_000_000n],
                [1_100_000_000n, 1_500_000_000n, 2_100_000_000n, 3_100_000_000n],
                [1_050_000_000n, 1_450_000_000n, 2_050_000_000n, 3_050_000_000n],
                [1_200_000_000n, 1_600_000_000n, 2_200_000_000n, 3_200_000_000n],
            ],
        });

        const fees = await calculateEip1559Fees(client);

        expect(fees).toBeDefined();
        expect(invariantHolds(fees!.low!)).toBe(true);
        expect(invariantHolds(fees!.medium!)).toBe(true);
        expect(invariantHolds(fees!.high!)).toBe(true);
        expect(invariantHolds(fees!.instant!)).toBe(true);
    });

    // Regression: Avalanche has been observed returning fewer blocks of history
    // than EIP1559_BLOCKS_TO_ANALYZE requested. Per the eth_feeHistory spec,
    // baseFeePerGas always has one MORE entry than reward (the extra one is the
    // network's projection of the next block's base fee) - so a node returning
    // only 2 blocks of the 4 requested yields baseFeePerGas.length === 3 and
    // reward.length === 2, not matching lengths. The old code read a hardcoded
    // index (EIP1559_BLOCKS_TO_ANALYZE - 1 === 3), which doesn't exist in a
    // 3-entry array, and silently fell back to a fabricated base fee of "0" via
    // `?? 0n`. A short-but-non-empty response is still valid EIP-1559 JSON-RPC -
    // its last entry is still the network's real next-block projection - so the
    // fix must use that real value, not fail closed on legitimate data.
    it('uses the real last entry rather than a fabricated zero for a short feeHistory response', async () => {
        const client = createClient({
            maxPriorityFeePerGas: 1_000_000n,
            baseFeePerGas: [3905n, 3907n, 3903n], // 2 observed blocks + 1 projection; 4 blocks were requested
            reward: [
                [1n, 100n, 200n, 300n],
                [1n, 100n, 200n, 300n],
            ],
        });

        const fees = await calculateEip1559Fees(client);

        expect(fees).toBeDefined();
        expect(fees!.baseFeePerGas).toBe('3903'); // the real next-block projection, not "0"
        expect(invariantHolds(fees!.low!)).toBe(true);
        expect(invariantHolds(fees!.medium!)).toBe(true);
        expect(invariantHolds(fees!.high!)).toBe(true);
    });

    // The genuinely indeterminate case: no baseFeePerGas entries at all. There is
    // no real value to fall back to here, so fail closed (the existing try/catch
    // returns undefined) rather than inventing a "0" base fee.
    it('fails closed when feeHistory returns no baseFeePerGas entries at all', async () => {
        const client = createClient({
            maxPriorityFeePerGas: 1_000_000n,
            baseFeePerGas: [],
            reward: [],
        });

        const fees = await calculateEip1559Fees(client);

        expect(fees).toBeUndefined();
    });

    it('populates the instant tier from the 99th percentile reward, distinct from the other tiers', async () => {
        // Each percentile column holds a different, distinguishable value so a
        // test that accidentally read the wrong reward index (e.g. 90th instead
        // of 99th) would fail rather than passing by coincidence.
        const client = createClient({
            maxPriorityFeePerGas: 1_000_000_000n,
            baseFeePerGas: [
                20_000_000_000n,
                20_000_000_000n,
                20_000_000_000n,
                20_000_000_000n,
                20_000_000_000n,
            ],
            reward: [
                // columns: [20th, 70th, 90th, 99th]
                [1_000_000_000n, 1_400_000_000n, 2_000_000_000n, 5_000_000_000n],
                [1_000_000_000n, 1_400_000_000n, 2_000_000_000n, 5_000_000_000n],
                [1_000_000_000n, 1_400_000_000n, 2_000_000_000n, 5_000_000_000n],
                [1_000_000_000n, 1_400_000_000n, 2_000_000_000n, 5_000_000_000n],
            ],
        });

        const fees = await calculateEip1559Fees(client);

        expect(fees?.instant).toBeDefined();
        expect(BigInt(fees!.instant!.maxPriorityFeePerGas!)).toBe(1_000_000_000n * 8n); // 8_000_000_000
        // baseFee (20e9) + 99th-percentile average reward (5e9) = 25e9, which is
        // >= the 8e9 tip, so the cap is the reward-derived value - the value that
        // pins the 99th percentile was actually read, not another column.
        expect(BigInt(fees!.instant!.maxFeePerGas!)).toBe(25_000_000_000n);
        expect(invariantHolds(fees!.instant!)).toBe(true);
        // Sanity: the other tiers, built from different percentile columns, must
        // land on different caps - otherwise this fixture wouldn't actually be
        // able to distinguish "instant" from its siblings.
        expect(fees!.instant!.maxFeePerGas).not.toBe(fees!.low!.maxFeePerGas);
        expect(fees!.instant!.maxFeePerGas).not.toBe(fees!.high!.maxFeePerGas);
    });
});
