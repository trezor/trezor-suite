import { type Random } from '@trezor/wabisabi-crypto';

import { randomElement } from './extensions';
import { type FeeRate, type ScriptType } from './money';
import { Output } from './output';

/**
 * `OrderByDescending` — a stable sort, as LINQ's is.
 *
 * `Array.prototype.sort` is stable in every engine Suite runs on, but LINQ orders
 * descending by comparing `y` to `x`, which keeps ties in their original order; doing it
 * by negating an ascending comparison would reverse them.
 */
export const orderByDescending = <T>(source: readonly T[], key: (item: T) => number): T[] =>
    [...source].sort((a, b) => {
        const left = key(a);
        const right = key(b);
        if (left === right) {
            return 0;
        }

        return left > right ? -1 : 1;
    });

/**
 * Port of `WalletWasabi/WabiSabi/Client/DenominationBuilder.cs`.
 *
 * Six series of standard denominations: powers of two, powers of three, powers of three
 * doubled, and the 1-2-5 decimal series.
 *
 * Every candidate draws a script type through `randomElement`, including the ones that
 * are then skipped for being below the minimum — so the number of draws depends on where
 * the minimum falls, not only on how many denominations survive.
 */
export const createDenominations = (
    minAllowedOutputAmount: number,
    maxAllowedOutputAmount: number,
    feeRate: FeeRate,
    allowedOutputTypes: readonly ScriptType[],
    random: Random,
): Output[] => {
    const denominations = new Map<string, Output>();

    const createDenom = (sats: number) => {
        const scriptType = randomElement(allowedOutputTypes, random) as ScriptType;

        // `Money.Satoshis((ulong)sats)` — the double is truncated to an integer.
        return Output.fromDenomination(Math.trunc(sats), scriptType, feeRate);
    };

    const addSeries = (value: (i: number) => number) => {
        for (let i = 0; ; i++) {
            const denom = createDenom(value(i));

            if (denom.amount < minAllowedOutputAmount) {
                continue;
            }
            if (denom.amount > maxAllowedOutputAmount) {
                break;
            }

            denominations.set(denom.key, denom);
        }
    };

    addSeries(i => 2 ** i); // Powers of 2
    addSeries(i => 3 ** i); // Powers of 3
    addSeries(i => 3 ** i * 2); // Powers of 3 * 2
    addSeries(i => 10 ** i); // Powers of 10 (1-2-5 series)
    addSeries(i => 10 ** i * 2); // Powers of 10 * 2 (1-2-5 series)
    addSeries(i => 10 ** i * 5); // Powers of 10 * 5 (1-2-5 series)

    // Greedy decomposer will take the higher values first. Order in a way to prioritize
    // cheaper denominations; this only matters in case of equality.
    return orderByDescending([...denominations.values()], x => x.effectiveAmount);
};

/** `OrderBy` — a stable ascending sort. */
export const orderBy = <T>(source: readonly T[], key: (item: T) => number): T[] =>
    [...source].sort((a, b) => {
        const left = key(a);
        const right = key(b);
        if (left === right) {
            return 0;
        }

        return left < right ? -1 : 1;
    });
