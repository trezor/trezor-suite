import { MAXIMUM_NUMBER_OF_SATOSHIS, isStdDenom } from './constants';
import { type RawLiquidityClue } from './types';

/**
 * Port of `LiquidityClueProvider.TryCalculateLiquidityClue`. Returns `undefined` where upstream
 * returns `false`, which the callers treat as "leave the clue as it is".
 */
const tryCalculateLiquidityClue = (foreignOutputsValues: number[]) => {
    // We only care about denom outputs as those can be considered reasonably mixed.
    const denoms = [...new Set(foreignOutputsValues.filter(isStdDenom))];

    // Take top 10% of denominations.
    const take = Math.ceil(denoms.length * 0.1);
    // Hermes does not support `toSorted`; `denoms` is a fresh array that is safe to sort in place.
    const topDenoms = denoms.sort((a, b) => b - a).slice(0, take);

    // `Average` of an empty sequence is upstream's `DefaultIfEmpty(Money.Zero)`, and the `(ulong)`
    // cast of its `double` result truncates.
    const average = topDenoms.length
        ? topDenoms.reduce((sum, denom) => sum + denom, 0) / topDenoms.length
        : 0;
    const value = Math.trunc(average);

    return value > 0 ? value : undefined;
};

/**
 * Port of `LiquidityClueHelper.InitLiquidityClue`, the `init-liquidity-clue` endpoint.
 *
 * Derives a fresh clue from the foreign output amounts of the account's most recent coinjoin.
 */
export const initLiquidityClue = (externalAmounts: number[]): RawLiquidityClue =>
    tryCalculateLiquidityClue(externalAmounts) ?? null;

/**
 * Port of `LiquidityClueHelper.UpdateLiquidityClue`, the `update-liquidity-clue` endpoint.
 *
 * Dismisses pleb rounds: if the new clue is close to the round's maximum suggested amount then the
 * round was likely a pleb round, so the previous clue is kept.
 */
export const updateLiquidityClue = (
    rawLiquidityClue: RawLiquidityClue,
    maxSuggestedAmount: number,
    externalAmounts: number[],
): RawLiquidityClue => {
    const liquidityClue = tryCalculateLiquidityClue(externalAmounts);

    // Upstream divides `Money` by a `long`, which is integer division.
    if (liquidityClue !== undefined && Math.trunc(maxSuggestedAmount / 2) > liquidityClue) {
        return liquidityClue;
    }

    return rawLiquidityClue;
};

/**
 * Port of `LiquidityClueHelper.GetLiquidityClue`, the `get-liquidity-clue` endpoint.
 *
 * Caps the clue at the round's maximum suggested amount. Without a clue the cap is the only limit.
 */
export const getLiquidityClue = (
    rawLiquidityClue: RawLiquidityClue,
    maxSuggestedAmount: number,
): number => Math.min(rawLiquidityClue ?? MAXIMUM_NUMBER_OF_SATOSHIS, maxSuggestedAmount);
