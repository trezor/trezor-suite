# @trezor/coinjoin-strategy

TypeScript port of the WabiSabi client's amount decomposition and input selection.

This replaces the two randomness-driven policy endpoints of the
`WalletWasabi.WabiSabiClientLibrary` binary that Suite used to bundle per platform and
drive over localhost HTTP: `get-outputs-amounts` and `select-inputs-for-round`. Both are
pure local computation.

## Upstream revision

Frozen at the same revision as [`@trezor/wabisabi-crypto`](../wabisabi-crypto), whose
`UPSTREAM` constant this package re-exports:
[`trezor/WalletWasabi`](https://github.com/trezor/WalletWasabi) `release/v15.0`, commit
`34a0f983`.

## Layout

| File                                     | Upstream                                                                                                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/money.ts`                           | `NBitcoin.{Money,FeeRate,ScriptType}`, `WabiSabi/Models/{MoneyRange,CoordinationFeeRate}.cs`, `Helpers/Constants.cs`, `Extensions/NBitcoinExtensions.cs` |
| `src/extensions.ts`                      | the randomness-consuming parts of `Extensions/LinqExtensions.cs`                                                                                         |
| `src/output.ts`                          | `WabiSabi/Client/Output.cs`                                                                                                                              |
| `src/denominationBuilder.ts`             | `WabiSabi/Client/DenominationBuilder.cs`                                                                                                                 |
| `src/amountDecomposer.ts`                | `WabiSabi/Client/AmountDecomposer.cs`                                                                                                                    |
| `src/getOutputAmounts.ts`                | `WabiSabiClientLibrary/Controllers/Helpers/GetOutputAmountsHelper.cs`                                                                                    |
| `src/coinSelector.ts`                    | `WabiSabi/Client/CoinJoinCoinSelector.cs`, `Backend/Rounds/UtxoSelectionParameters.cs`, `Helpers/CoinHelpers.cs`                                         |
| `src/coinSelectorRandomnessGenerator.ts` | `WabiSabi/Client/CoinJoinCoinSelectorRandomnessGenerator.cs`                                                                                             |
| `src/roundParameters.ts`                 | the client-side parts of `Backend/Rounds/RoundParameters.cs`                                                                                             |
| `src/selectInputsForRound.ts`            | `WabiSabiClientLibrary/Controllers/Helpers/SelectInputsForRoundHelper.cs`                                                                                |

## Why nothing here is simplified

`AmountDecomposer` carries this comment upstream:

> Pull requests to this file must be up to date with this simulation to ensure
> correctness: https://github.com/nopara73/Sake

A decomposition that differs from Wasabi's fingerprints Suite's outputs inside a shared
round, and a selection that differs does the same for its inputs. Neither failure mode
throws — the round completes and the privacy is just worse — so the committed upstream
vectors are the only guard, which is why they are a gate here and not a nice-to-have.

## Upstream quirks reproduced deliberately

Each of these is commented at the site where it is reproduced.

- **`FeeRate.GetFee` truncates, and a truncated-to-zero fee becomes one satoshi** —
  unconditionally, including at a zero fee rate.
- **`DenominationBuilder` draws a script type for every candidate**, including the ones it
  then skips for being below the minimum, so the number of draws depends on where the
  minimum falls.
- **`GetFilteredDenominations` divides by `filterSeverity` and truncates** the `double`
  result back to satoshis.
- **The cost and change tolerances round trip through BTC as a C# `decimal`**, so the
  `× 1.2` and `× 0.1` factors are exact and only the final conversion truncates. Applying
  them in floating point floors one satoshi low for some inputs.
- **`remaining / 3` in `CreatePreDecompositions` is integer division.**
- **`AmountDecomposer.CalculateHash`** folds the candidate amounts into a .NET `HashCode`,
  which is randomly seeded per process, so its value is not reproducible even between two
  runs of the binary. It is only a `TryAdd` de-duplication key, so the ordered amounts are
  used directly here: same intent, no dependence on a random seed, and no collisions.
- **`CoinJoinCoinSelector`'s `groups` dictionary never de-duplicates.** Its key is
  `HashCode.Combine(group.OrderBy(...))`, whose single argument is a freshly created
  iterator, so the key is an object identity hash and differs on every call. It is in
  effect an insertion-ordered list, and that is what the port uses.
- **The combination search is bounded by a wall clock** (one second per largest
  non-private coin, ten seconds overall), so the candidate set depends on machine speed
  upstream as well as here.

## Parity

- `src/__fixtures__/getOutputsAmounts.json` and `selectInputsForRound.json` are the
  committed upstream integration-test vectors, including the `Not enough money` error
  case, asserted under the deterministic PRNG from
  `@trezor/wabisabi-crypto/src/testing`.
- `GetOutputHelperTests.cs` and `SelectInputsForRoundHelperTests.cs` are ported in full.
- `AmountDecomposerTests.cs` is ported as the invariant suite it is, with its 24 cases.
- `CoinJoinCoinSelectionTests.cs` is ported; one assertion is adapted, see the comment on
  `selects the non-private coin out of a big set in consolidation mode`.

## Performance note

`CreatePreDecompositions` runs ten thousand iterations, which costs roughly 150 ms to
1.2 s here depending on the denomination count. The binary does the same work natively.
Callers must keep a yield point around `getOutputAmounts`.
