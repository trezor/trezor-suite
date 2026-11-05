import { MAXIMUM_NUMBER_OF_SATOSHIS, isStdDenom } from './constants';

/**
 * Port of `WalletWasabi/WabiSabi/Client/LiquidityClueProvider.cs` and the three
 * `init-liquidity-clue` / `update-liquidity-clue` / `get-liquidity-clue` endpoints of
 * `WalletWasabi.WabiSabiClientLibrary/Controllers/Helpers/LiquidityClueHelper.cs`.
 *
 * The liquidity clue is a weak preference not to register inputs larger than what the
 * last coinjoin's foreign denomination outputs suggest. It is the one piece of this state
 * that is persisted in Suite's account state, as `RawLiquidityClue`.
 */

/** `LiquidityClueProvider.LiquidityClue` — `null` when no clue has been established. */
export type RawLiquidityClue = number | null;

/**
 * `LiquidityClueProvider.TryCalculateLiquidityClue`.
 *
 * Returns `null` when the computed clue is not positive, which is what
 * `TryCalculateLiquidityClue` returning `false` means to its callers.
 */
const tryCalculateLiquidityClue = (foreignOutputsValues: readonly number[]): number | null => {
    // We only care about denom outputs as those can be considered reasonably mixed.
    const denoms = [...new Set(foreignOutputsValues.filter(isStdDenom))];

    // Take top 10% of denominations.
    const take = Math.ceil(denoms.length * 0.1);
    const topDenoms = [...denoms].sort((a, b) => b - a).slice(0, take);

    // `Money.Satoshis((ulong)topDenoms.DefaultIfEmpty(Money.Zero).Average(...))` —
    // `Average` over longs produces a `double`, and the `(ulong)` cast truncates it. An
    // average of, say, 16384 and 13122 is 14753.0 exactly, but three denominations
    // averaging to 14753.333… becomes 14753, not 14754.
    const average =
        topDenoms.length === 0
            ? 0
            : Math.trunc(topDenoms.reduce((total, value) => total + value, 0) / topDenoms.length);

    return average > 0 ? average : null;
};

/**
 * `init-liquidity-clue`.
 *
 * Note that this keeps the previous clue when the new one would be zero, which is why it
 * takes the current value: `InitLiquidityClue` only assigns on success.
 */
export const initLiquidityClue = (externalAmounts: readonly number[]): RawLiquidityClue =>
    tryCalculateLiquidityClue(externalAmounts);

/**
 * `update-liquidity-clue`.
 *
 * Dismisses pleb rounds: if the new clue is close to the max suggested amount then the
 * round is likely a pleb round and the clue is left alone.
 *
 * `maxSuggestedAmount / 2` is `Money / long` in NBitcoin, i.e. integer division, so an
 * odd max suggested amount rounds the threshold down.
 */
export const updateLiquidityClue = (
    rawLiquidityClue: RawLiquidityClue,
    maxSuggestedAmount: number,
    externalAmounts: readonly number[],
): RawLiquidityClue => {
    const liquidityClue = tryCalculateLiquidityClue(externalAmounts);
    if (liquidityClue !== null && Math.trunc(maxSuggestedAmount / 2) > liquidityClue) {
        return liquidityClue;
    }

    return rawLiquidityClue;
};

/** `get-liquidity-clue`. */
export const getLiquidityClue = (
    rawLiquidityClue: RawLiquidityClue,
    maxSuggestedAmount: number,
): number => Math.min(rawLiquidityClue ?? MAXIMUM_NUMBER_OF_SATOSHIS, maxSuggestedAmount);
