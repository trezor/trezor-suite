import { type Random } from '@trezor/wabisabi-crypto';

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

/**
 * Port of the randomness-consuming parts of `WalletWasabi/Extensions/LinqExtensions.cs`.
 *
 * The decomposer and the coin selector draw all of their randomness through these, so
 * the exact number of draws and the order they happen in is part of the behaviour, not
 * an implementation detail. None of the upstream vectors pass otherwise.
 */

/**
 * `RandomElement` — reservoir sampling.
 *
 * Note that this draws once **per element**, not once in total, and that it returns
 * `undefined` for an empty sequence (upstream's `default`).
 */
export const randomElement = <T>(source: Iterable<T>, random: Random): T | undefined => {
    let current: T | undefined;
    let count = 0;
    for (const element of source) {
        count++;
        if (random.getInt(0, count) === 0) {
            current = element;
        }
    }

    return current;
};

/**
 * `BiasedRandomElement` — selects a random element based on order bias.
 *
 * `biasPercent` is 1-100; e.g. 80 means an 80% chance of taking the first element, then
 * 80% of the remainder for the second, and so on. Falls back to the first element.
 */
export const biasedRandomElement = <T>(
    source: readonly T[],
    biasPercent: number,
    random: Random,
): T | undefined => {
    for (const element of source) {
        if (random.getInt(1, 101) <= biasPercent) {
            return element;
        }
    }

    return source.length > 0 ? source[0] : undefined;
};

/**
 * `Shuffle` — Fisher-Yates from the end, mutating the list in place and returning it.
 *
 * Upstream mutates, and `AmountDecomposer.Decompose` relies on that: it shuffles
 * `preCandidates` and then reads the same list.
 */
export const shuffle = <T>(list: T[], random: Random): T[] => {
    let n = list.length;
    while (n > 1) {
        n--;
        const k = random.getInt(0, n + 1);
        const value = list[k] as T;
        list[k] = list[n] as T;
        list[n] = value;
    }

    return list;
};

/** `ToShuffled` — copies, then shuffles. */
export const toShuffled = <T>(list: Iterable<T>, random: Random): T[] => shuffle([...list], random);

/** `WeightedMean`. */
export const weightedMean = <T>(
    source: readonly T[],
    value: (item: T) => number,
    weight: (item: T) => number,
) => {
    const weightedSum = sum(source.map(item => value(item) * weight(item)));
    const weightSum = sum(source.map(weight));

    return weightedSum / weightSum;
};

/**
 * `GeneralizedWeightedMean` — https://en.wikipedia.org/wiki/Generalized_mean
 *
 * All IEEE-754 double arithmetic, and the summation order is upstream's, so JavaScript
 * reproduces it exactly.
 */
export const generalizedWeightedMean = <T>(
    source: readonly T[],
    value: (item: T) => number,
    weight: (item: T) => number,
    p: number,
) => {
    if (source.length === 0) {
        throw new Error('source cannot be empty.');
    }
    if (source.some(item => value(item) < 0)) {
        throw new Error('value cannot be negative.');
    }
    if (source.some(item => weight(item) < 0)) {
        throw new Error('weight cannot be negative.');
    }
    if (source.every(item => weight(item) === 0)) {
        throw new Error('weight cannot be all zero.');
    }
    if (p === 0) {
        throw new Error('p cannot be zero.');
    }

    return (
        (sum(source.map(item => value(item) ** p * weight(item))) / sum(source.map(weight))) **
        (1 / p)
    );
};

/**
 * `CombinationsWithoutRepetition` — every combination of `ofLength` items.
 *
 * Yields in upstream's order: a stack of partial templates, pushing the remaining items
 * back to front so that they come off the stack front to back. The coin selector depends
 * on this order because it stops enumerating on a wall-clock budget.
 */
export function* combinationsWithoutRepetition<T>(
    items: readonly T[],
    ofLength: number,
): Generator<T[]> {
    const templates: { result: T[]; from: number }[] = [{ result: [], from: 0 }];

    while (templates.length > 0) {
        const { result, from } = templates.pop() as { result: T[]; from: number };
        const restCount = items.length - from;
        if (result.length === ofLength) {
            yield result;
        } else if (result.length + restCount >= ofLength) {
            for (let i = restCount - 1; i >= 0; i--) {
                templates.push({ result: [...result, items[from + i] as T], from: from + i + 1 });
            }
        }
    }
}
