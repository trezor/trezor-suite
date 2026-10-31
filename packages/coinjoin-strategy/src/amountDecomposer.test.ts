import { secureRandom } from '@trezor/wabisabi-crypto';
import { DeterministicRandom } from '@trezor/wabisabi-crypto/src/testing';

import { AmountDecomposer } from './amountDecomposer';
import { createDenominations } from './denominationBuilder';
import {
    COORDINATION_FEE_RATE_ZERO,
    MAX_AMOUNT_PER_ALICE,
    ScriptType,
    effectiveValue,
    estimateOutputVsize,
} from './money';

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

/**
 * Port of `WalletWasabi.Tests/UnitTests/WabiSabi/Client/AmountDecomposerTests.cs`.
 *
 * Upstream generates random coins from a seeded PRNG and drives the decomposer from an
 * unseeded one, then asserts invariants rather than exact decompositions. Same here: the
 * coins come from `DeterministicRandom(0)` so the cases are reproducible, and the
 * decomposer gets the production CSPRNG so the invariants have to hold for any draw.
 */
describe('AmountDecomposer invariants', () => {
    const cases: [number, number, number, boolean][] = [
        // [feeRateSatoshiPerVByte, minOutputAmount, maxAvailableOutputs, isTaprootEnabled]
        [0, 0, 8, false],
        [0, 0, 1, false],
        [0, 0, 2, false],
        [0, 0, 3, false],
        [0, 1_000, 1, false],
        [0, 100_000, 2, false],
        [0, 1_000_000, 3, false],
        [0, 10_000_000, 8, false],
        [20, 0, 1, false],
        [100, 0, 2, false],
        [500, 0, 3, false],
        [5000, 0, 8, false],
        [0, 0, 8, true],
        [0, 0, 1, true],
        [0, 0, 2, true],
        [0, 0, 3, true],
        [0, 1_000, 1, true],
        [0, 100_000, 2, true],
        [0, 1_000_000, 3, true],
        [0, 10_000_000, 8, true],
        [20, 0, 1, true],
        [100, 0, 2, true],
        [500, 0, 3, true],
        [5000, 0, 8, true],
    ];

    it.each(cases)(
        'fee rate %i, min output %i, up to %i outputs, taproot %s',
        (feeRatePerVByte, minOutputAmount, maxAvailableOutputs, isTaprootEnabled) => {
            const outputVirtualSize = estimateOutputVsize(
                isTaprootEnabled ? ScriptType.Taproot : ScriptType.P2WPKH,
            );
            const availableVsize = maxAvailableOutputs * outputVirtualSize;
            const feeRate = { feePerK: feeRatePerVByte * 1000 };
            const allowedOutputTypes = isTaprootEnabled
                ? [ScriptType.Taproot, ScriptType.P2WPKH]
                : [ScriptType.P2WPKH];

            // `GenerateRandomCoins` — a single P2WPKH script, amounts in
            // [100_000, MaxAmountPerAlice).
            const coinRandom = new DeterministicRandom(0);
            const generateCoins = (count: number) =>
                Array.from({ length: count }, () => {
                    const amount =
                        100_000 +
                        coinRandom.getInt(0, 2_000_000_000) * 2 +
                        coinRandom.getInt(0, 1_000);

                    return effectiveValue(
                        Math.min(amount, MAX_AMOUNT_PER_ALICE - 1),
                        ScriptType.P2WPKH,
                        feeRate,
                        COORDINATION_FEE_RATE_ZERO,
                    );
                });

            const registeredCoinEffectiveValues = generateCoins(3);
            const theirCoinEffectiveValues = generateCoins(30);

            const decomposer = new AmountDecomposer(
                feeRate,
                minOutputAmount,
                MAX_AMOUNT_PER_ALICE,
                availableVsize,
                allowedOutputTypes,
                secureRandom,
            );
            const outputValues = decomposer.decompose(
                registeredCoinEffectiveValues,
                theirCoinEffectiveValues,
            );

            const totalEffectiveValue = sum(registeredCoinEffectiveValues);
            const totalEffectiveCost = sum(outputValues.map(x => x.effectiveCost));

            if (!isTaprootEnabled) {
                expect(outputValues.length).toBeGreaterThanOrEqual(1);
                expect(outputValues.length).toBeLessThanOrEqual(maxAvailableOutputs);
            } else {
                // The number of outputs cannot be bounded because of the random script
                // type, so the total virtual size is checked instead.
                const totalVsize = sum(outputValues.map(x => estimateOutputVsize(x.scriptType)));
                expect(totalVsize).toBeGreaterThanOrEqual(1);
                expect(totalVsize).toBeLessThanOrEqual(availableVsize);
            }

            expect(totalEffectiveValue - totalEffectiveCost - minOutputAmount).toBeLessThanOrEqual(
                totalEffectiveCost,
            );

            outputValues.forEach(v => {
                expect(v.effectiveCost).toBeGreaterThanOrEqual(minOutputAmount);
                expect(v.effectiveCost).toBeLessThanOrEqual(totalEffectiveValue);
            });

            if (!isTaprootEnabled) {
                expect(outputValues.some(o => o.scriptType === ScriptType.Taproot)).toBe(false);
            }
        },
    );
});

describe('DenominationBuilder', () => {
    it('builds the 2, 3, 3*2 and 1-2-5 series within the allowed range', () => {
        const denominations = createDenominations(
            10_000,
            200_000,
            { feePerK: 0 },
            [ScriptType.Taproot],
            new DeterministicRandom(0),
        );
        const amounts = denominations.map(x => x.amount).sort((a, b) => a - b);

        expect(amounts).toContain(16_384); // 2^14
        expect(amounts).toContain(19_683); // 3^9
        expect(amounts).toContain(13_122); // 3^8 * 2
        expect(amounts).toContain(100_000); // 10^5
        expect(amounts).toContain(20_000); // 10^4 * 2
        expect(amounts).toContain(50_000); // 10^4 * 5
        // Nothing outside the range, and no duplicates.
        amounts.forEach(amount => {
            expect(amount).toBeGreaterThanOrEqual(10_000);
            expect(amount).toBeLessThanOrEqual(200_000);
        });
        expect(new Set(amounts).size).toBe(amounts.length);
    });

    it('orders by descending effective amount', () => {
        const denominations = createDenominations(
            10_000,
            200_000,
            { feePerK: 1000 },
            [ScriptType.Taproot],
            new DeterministicRandom(0),
        );

        denominations.slice(1).forEach((denom, index) => {
            expect((denominations[index] as typeof denom).effectiveAmount).toBeGreaterThanOrEqual(
                denom.effectiveAmount,
            );
        });
    });

    it('consumes a script type draw even for denominations it then skips', () => {
        // Each candidate draws before the range check, so two builders over different
        // ranges diverge in how much randomness they consume. This pins the behaviour
        // that the committed vectors depend on.
        const trace: number[] = [];
        const tracing = {
            getBytes: (length: number) => new Uint8Array(length),
            getInt: (fromInclusive: number, toExclusive: number) => {
                trace.push(toExclusive);

                return fromInclusive;
            },
            getScalar: () => 1n,
        };
        createDenominations(10_000, 20_000, { feePerK: 0 }, [ScriptType.Taproot], tracing);
        const narrow = trace.length;
        trace.length = 0;
        createDenominations(1, 20_000, { feePerK: 0 }, [ScriptType.Taproot], tracing);

        expect(narrow).toBe(trace.length);
        expect(narrow).toBeGreaterThan(0);
    });
});
