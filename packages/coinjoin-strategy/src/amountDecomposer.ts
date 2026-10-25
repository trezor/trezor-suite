import { type Random } from '@trezor/wabisabi-crypto';

import { createDenominations, orderBy, orderByDescending } from './denominationBuilder';
import { randomElement, shuffle } from './extensions';
import { type FeeRate, ScriptType, estimateOutputVsize, getFee } from './money';
import { Output } from './output';

interface Candidate {
    decomposition: Output[];
    cost: number;
}

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

const findChange = (decomposition: readonly Output[], denomKeys: ReadonlySet<string>) =>
    sum(decomposition.map(x => (denomKeys.has(x.key) ? 0 : x.amount)));

const calculateCost = (outputs: readonly Output[]) => {
    // The cost of the outputs. The more the worse.
    const outputCost = sum(outputs.map(o => o.fee));

    // The cost of sending further or remixing these coins.
    const inputCost = sum(outputs.map(o => o.inputFee));

    return outputCost + inputCost;
};

/**
 * `AmountDecomposer.CalculateHash` — the de-duplication key for candidate decompositions.
 *
 * Upstream folds the amounts into a .NET `HashCode`, which is seeded randomly per
 * process, so its value is not reproducible even between two runs of the binary. It is
 * only ever used as a dictionary key for `TryAdd`, so the decomposition only depends on
 * it through collisions, and a 32-bit hash over ten thousand candidates collides in
 * about one run in a hundred. This uses the ordered amounts themselves, which cannot
 * collide: same intent, no dependence on a random seed.
 */
const calculateHash = (outputs: readonly Output[]) =>
    orderBy(outputs, x => x.effectiveCost)
        .map(x => x.amount)
        .join(',');

/** LINQ's `OrderBy(...).ThenBy(...)` chain — one stable sort over a key tuple. */
const orderByKeys = <T>(source: readonly T[], keys: (item: T) => number[]): T[] => {
    const decorated = source.map((item, index) => ({ item, index, keys: keys(item) }));
    decorated.sort((a, b) => {
        for (let i = 0; i < a.keys.length; i++) {
            const left = a.keys[i] as number;
            const right = b.keys[i] as number;
            if (left !== right) {
                return left < right ? -1 : 1;
            }
        }

        return a.index - b.index;
    });

    return decorated.map(x => x.item);
};

/** `.ToHashSet()` over records, preserving insertion order as .NET's `HashSet` does. */
const distinctBy = <T>(source: readonly T[], key: (item: T) => string): T[] => {
    const seen = new Set<string>();

    return source.filter(item => {
        const k = key(item);
        if (seen.has(k)) {
            return false;
        }
        seen.add(k);

        return true;
    });
};

/**
 * Port of `WalletWasabi/WabiSabi/Client/AmountDecomposer.cs`.
 *
 * Upstream carries this comment, and it is the reason nothing here is simplified:
 *
 * > Pull requests to this file must be up to date with this simulation to ensure
 * > correctness: https://github.com/nopara73/Sake
 *
 * A decomposition that differs from Wasabi's fingerprints Suite's outputs inside a
 * shared round, so divergence here is a privacy bug that nothing crashes on.
 */
export class AmountDecomposer {
    readonly feeRate: FeeRate;
    readonly availableVsize: number;
    readonly allowedOutputTypes: readonly ScriptType[];
    readonly minAllowedOutputAmount: number;
    readonly maxAllowedOutputAmount: number;

    /** Many standard denominations, ordered by descending effective amount. */
    readonly denominations: Output[];
    readonly changeScriptType: ScriptType;

    private readonly random: Random;

    constructor(
        feeRate: FeeRate,
        minAllowedOutputAmount: number,
        maxAllowedOutputAmount: number,
        availableVsize: number,
        allowedOutputTypes: readonly ScriptType[],
        random: Random,
    ) {
        this.feeRate = feeRate;
        this.availableVsize = availableVsize;
        this.allowedOutputTypes = allowedOutputTypes;
        this.minAllowedOutputAmount = minAllowedOutputAmount;
        this.maxAllowedOutputAmount = maxAllowedOutputAmount;
        this.random = random;

        this.denominations = createDenominations(
            minAllowedOutputAmount,
            maxAllowedOutputAmount,
            feeRate,
            allowedOutputTypes,
            random,
        );

        this.changeScriptType = randomElement(allowedOutputTypes, random) as ScriptType;
    }

    get changeFee() {
        return getFee(this.feeRate, estimateOutputVsize(this.changeScriptType));
    }

    decompose(
        myInputCoinEffectiveValues: readonly number[],
        othersInputCoinEffectiveValues: readonly number[],
    ): Output[] {
        const denoms = this.getFilteredDenominations([
            ...othersInputCoinEffectiveValues,
            ...myInputCoinEffectiveValues,
        ]);
        const myInputs = [...myInputCoinEffectiveValues];
        const myInputSum = sum(myInputs);
        const smallestScriptType = Math.min(
            estimateOutputVsize(ScriptType.P2WPKH),
            estimateOutputVsize(ScriptType.Taproot),
        );
        // The absolute max possible with the smallest script type.
        const maxNumberOfOutputsAllowed = Math.min(
            Math.trunc(this.availableVsize / smallestScriptType),
            10,
        );

        // `denoms.Min(...)` throws on an empty sequence upstream, and an empty sequence is
        // reachable when no denomination occurred twice in the frequency table.
        if (denoms.length === 0) {
            throw new Error('Sequence contains no elements.');
        }

        // If my input sum is smaller than the smallest denomination, then participation
        // in a coinjoin makes no sense.
        if (Math.min(...denoms.map(x => x.effectiveCost)) > myInputSum) {
            throw new Error('Not enough coins registered to participate in the coinjoin.');
        }

        // A `Dictionary<int, ...>` upstream, keyed by `CalculateHash`. Enumeration order
        // is insertion order either way; see `calculateHash` for the key itself.
        const setCandidates = new Map<string, Candidate>();

        // Create the most naive decomposition for starter.
        const naiveDecomp = this.createNaiveDecomposition(
            denoms,
            myInputSum,
            maxNumberOfOutputsAllowed,
        );
        setCandidates.set(naiveDecomp.key, naiveDecomp.value);

        // Create more pre-decompositions for sanity.
        this.createPreDecompositions(denoms, myInputSum, maxNumberOfOutputsAllowed).forEach(
            ({ key, value }) => {
                if (!setCandidates.has(key)) {
                    setCandidates.set(key, value);
                }
            },
        );

        const denomKeys = new Set(denoms.map(x => x.key));
        let preCandidates = [...setCandidates.values()];

        // If there are changeless candidates, don't even consider ones with change.
        const changelessCandidates = preCandidates.filter(x =>
            x.decomposition.every(y => denomKeys.has(y.key)),
        );
        const changeAvoided = changelessCandidates.length > 0;
        if (changeAvoided) {
            preCandidates = changelessCandidates;
        }
        shuffle(preCandidates, this.random);

        // `OrderBy(change).ThenBy(cost).ThenBy(mixedScriptTypes)` is one composite stable
        // sort in LINQ, not three sequential ones — three sequential stable sorts would
        // end up ordered by the *last* key.
        const orderedCandidates = orderByKeys(preCandidates, x => [
            findChange(x.decomposition, denomKeys), // Less change is better.
            x.cost, // Less cost is better.
            // Prefer mixed script types.
            x.decomposition.some(d => d.scriptType === ScriptType.Taproot) &&
            x.decomposition.some(d => d.scriptType === ScriptType.P2WPKH)
                ? 0
                : 1,
        ]);

        // We want to introduce randomness between the best selections. If we successfully
        // avoided change then what matters is cost; if we didn't, cost is irrelevant
        // because the size of the change is more costly.
        let finalCandidates: Candidate[];
        if (changeAvoided) {
            const bestCandidateCost = (orderedCandidates[0] as Candidate).cost;
            // `Money.Coins(bestCandidateCost.ToUnit(MoneyUnit.BTC) * 1.2m)` — a round trip
            // through BTC as a C# `decimal`, so the multiplication is exact and only the
            // final conversion back to satoshis truncates. `cost * 1.2` in floating point
            // is not exact (15 * 1.2 is 17.999999999999996, which would truncate to 17
            // where the decimal gives 18), so the factor is applied as a fraction.
            const costTolerance = Math.trunc((bestCandidateCost * 12) / 10);
            finalCandidates = orderedCandidates.filter(x => x.cost <= costTolerance);
        } else {
            // Change can only be max between: 100.000 satoshis, 10% of the inputs sum, or
            // 20% more than the best candidate's change.
            const bestCandidateChange = findChange(
                (orderedCandidates[0] as Candidate).decomposition,
                denomKeys,
            );
            // Same decimal round trip: the maximum is taken over exact BTC values and
            // only then converted back to satoshis, so compare the three candidates
            // scaled by ten and truncate once at the end.
            const changeTolerance = Math.trunc(
                Math.max(myInputSum, bestCandidateChange * 12, 100_000 * 10) / 10,
            );
            finalCandidates = orderedCandidates.filter(
                x => findChange(x.decomposition, denomKeys) <= changeTolerance,
            );
        }

        // We want to make sure our random selection is not between similar decompositions.
        // Different largest elements result in very different decompositions.
        const largestAmounts = distinctBy(
            finalCandidates.map(x => x.decomposition[0] as Output),
            x => x.key,
        );
        const largestAmount = randomElement(largestAmounts, this.random) as Output;
        const finalCandidate = (
            randomElement(
                finalCandidates.filter(
                    x => (x.decomposition[0] as Output).key === largestAmount.key,
                ),
                this.random,
            ) as Candidate
        ).decomposition;

        const totalOutputAmount = sum(finalCandidate.map(x => x.effectiveCost));
        if (totalOutputAmount > myInputSum) {
            throw new Error('The decomposer is creating money. Aborting.');
        }
        if (totalOutputAmount + this.minAllowedOutputAmount + this.changeFee < myInputSum) {
            throw new Error('The decomposer is losing money. Aborting.');
        }

        const totalOutputVsize = sum(finalCandidate.map(d => estimateOutputVsize(d.scriptType)));
        if (totalOutputVsize > this.availableVsize) {
            throw new Error('The decomposer created more outputs than it can. Aborting.');
        }

        return finalCandidate;
    }

    private getFilteredDenominations(allInputEffectiveValues: readonly number[]): Output[] {
        const histogram = this.getDenominationFrequencies(allInputEffectiveValues);

        // Filter out and order denominations that have occurred in the frequency table at
        // least twice.
        const preFilteredDenoms = orderByDescending(
            [...histogram.values()].filter(x => x.count > 1).map(x => x.denom),
            x => x.effectiveCost,
        );

        // Filter out denominations very close to each other. Heavy filtering on the top,
        // little to no filtering on the bottom, because in smaller denom levels larger
        // users are expected to participate, but on larger denom levels there's little
        // chance of finding each other.
        const increment = 0.5 / preFilteredDenoms.length;
        const denoms: Output[] = [];
        let currentLength = preFilteredDenoms.length;
        for (const denom of preFilteredDenoms) {
            const filterSeverity = 1 + currentLength * increment;
            if (
                denoms.length === 0 ||
                // `(long)(denoms.Last().Amount.Satoshi / filterSeverity)` — a truncating
                // cast of a double division, not a rounded one.
                denom.amount <=
                    Math.trunc((denoms[denoms.length - 1] as Output).amount / filterSeverity)
            ) {
                denoms.push(denom);
            }
            currentLength--;
        }

        return denoms;
    }

    private createPreDecompositions(
        denoms: readonly Output[],
        myInputSum: number,
        maxNumberOfOutputsAllowed: number,
    ): { key: string; value: Candidate }[] {
        const setCandidates: { key: string; value: Candidate }[] = [];

        for (let i = 0; i < 10_000; i++) {
            let remainingVsize = this.availableVsize;
            let remaining = myInputSum;
            const currentSet: Output[] = [];
            for (;;) {
                const denom =
                    randomElement(
                        denoms.filter(
                            x =>
                                x.effectiveCost <= remaining &&
                                // `remaining / 3` is integer division on a `Money`.
                                x.effectiveCost >= Math.trunc(remaining / 3),
                        ),
                        this.random,
                    ) ?? denoms.find(x => x.effectiveCost <= remaining);

                // Continue only if there is enough remaining amount and size to create one
                // output (+ change if change could potentially be created). There can be
                // change only if the remaining is at least the current denom effective cost
                // plus the minimum change effective cost.
                if (
                    denom === undefined ||
                    (remaining <
                        denom.effectiveCost + this.minAllowedOutputAmount + this.changeFee &&
                        remainingVsize < estimateOutputVsize(denom.scriptType)) ||
                    (remaining >=
                        denom.effectiveCost + this.minAllowedOutputAmount + this.changeFee &&
                        remainingVsize <
                            estimateOutputVsize(denom.scriptType) +
                                estimateOutputVsize(this.changeScriptType))
                ) {
                    break;
                }

                currentSet.push(denom);
                remaining -= denom.effectiveCost;
                remainingVsize -= estimateOutputVsize(denom.scriptType);

                // Can't have more denoms than max - 1, where -1 is to account for possible change.
                if (currentSet.length >= maxNumberOfOutputsAllowed - 1) {
                    break;
                }
            }

            let loss = 0;
            if (remaining >= this.minAllowedOutputAmount + this.changeFee) {
                currentSet.push(Output.fromAmount(remaining, this.changeScriptType, this.feeRate));
            } else {
                // This goes to miners.
                loss = remaining;
            }

            setCandidates.push({
                key: calculateHash(currentSet),
                value: { decomposition: currentSet, cost: loss + calculateCost(currentSet) },
            });
        }

        return setCandidates;
    }

    private createNaiveDecomposition(
        denoms: readonly Output[],
        myInputSum: number,
        maxNumberOfOutputsAllowed: number,
    ): { key: string; value: Candidate } {
        let remainingVsize = this.availableVsize;
        let remaining = myInputSum;
        const naiveSet: Output[] = [];

        // `denoms.Where(x => x.Amount <= remaining)` is evaluated lazily against the
        // mutating `remaining`, so the filter tightens as the loop consumes the input sum.
        for (const denom of denoms) {
            if (!(denom.amount <= remaining)) {
                continue;
            }
            let end = false;
            while (denom.effectiveCost <= remaining) {
                if (
                    (remaining <
                        denom.effectiveCost + this.minAllowedOutputAmount + this.changeFee &&
                        remainingVsize < estimateOutputVsize(denom.scriptType)) ||
                    (remaining >=
                        denom.effectiveCost + this.minAllowedOutputAmount + this.changeFee &&
                        remainingVsize <
                            estimateOutputVsize(denom.scriptType) +
                                estimateOutputVsize(this.changeScriptType))
                ) {
                    end = true;
                    break;
                }

                naiveSet.push(denom);
                remaining -= denom.effectiveCost;
                remainingVsize -= estimateOutputVsize(denom.scriptType);

                // Can't have more denoms than max - 1, where -1 is to account for possible change.
                if (naiveSet.length >= maxNumberOfOutputsAllowed - 1) {
                    end = true;
                    break;
                }
            }

            if (end) {
                break;
            }
        }

        let loss = 0;
        if (remaining >= this.minAllowedOutputAmount + this.changeFee) {
            naiveSet.push(Output.fromAmount(remaining, this.changeScriptType, this.feeRate));
        } else {
            // This goes to miners.
            loss = remaining;
        }

        // This can happen when the smallest denom is larger than the input sum.
        if (naiveSet.length === 0) {
            naiveSet.push(Output.fromAmount(remaining, this.changeScriptType, this.feeRate));
        }

        return {
            key: calculateHash(naiveSet),
            value: { decomposition: naiveSet, cost: loss + calculateCost(naiveSet) },
        };
    }

    /** Pair of denomination and the number of times we found it in a breakdown. */
    private getDenominationFrequencies(inputEffectiveValues: readonly number[]) {
        // Upstream indexes `Skip(1).First()`, which throws for a single input. That is
        // reachable: it is how a round with one registered input fails.
        const sorted = orderByDescending(inputEffectiveValues, x => x);
        if (sorted.length < 2) {
            throw new Error('Sequence contains no elements.');
        }
        const secondLargestInput = sorted[1] as number;
        const denomsForBreakDown = orderByDescending(
            // Take only affordable denominations.
            this.denominations.filter(x => x.effectiveCost <= secondLargestInput),
            // If the amount is the same, the cheaper to spend should be first, so greedy
            // will take that.
            x => x.effectiveAmount,
        );

        const denomFrequencies = new Map<string, { denom: Output; count: number }>();
        for (const input of inputEffectiveValues) {
            for (const denom of this.breakDown(input, denomsForBreakDown)) {
                const existing = denomFrequencies.get(denom.key);
                if (existing === undefined) {
                    denomFrequencies.set(denom.key, { denom, count: 1 });
                } else {
                    existing.count++;
                }
            }
        }

        return denomFrequencies;
    }

    /** Greedily decomposes an amount to the given denominations. */
    private breakDown(coinInputEffectiveValue: number, denominations: readonly Output[]): Output[] {
        let remaining = coinInputEffectiveValue;
        const denoms: Output[] = [];

        for (const denom of denominations) {
            if (
                denom.amount < this.minAllowedOutputAmount ||
                remaining < this.minAllowedOutputAmount + this.changeFee
            ) {
                break;
            }

            while (denom.effectiveCost <= remaining) {
                denoms.push(denom);
                remaining -= denom.effectiveCost;
            }
        }

        if (remaining >= this.minAllowedOutputAmount + this.changeFee) {
            denoms.push(Output.fromAmount(remaining, this.changeScriptType, this.feeRate));
        }

        return denoms;
    }
}
