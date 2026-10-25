# @trezor/coinjoin-analysis

TypeScript port of the WabiSabi client's blockchain analysis.

This replaces four endpoints of the `WalletWasabi.WabiSabiClientLibrary` binary that Suite
used to bundle per platform and drive over localhost HTTP: `get-anonymity-scores`,
`init-liquidity-clue`, `update-liquidity-clue` and `get-liquidity-clue`. All four are pure
local computation, and the anonymity scorer in particular used to receive the account's
whole transaction graph — counterparty addresses included — over a socket on every sync.

Deterministic and dependency-free: nothing here draws randomness.

## Upstream revision

Frozen at [`trezor/WalletWasabi`](https://github.com/trezor/WalletWasabi) `release/v15.0`,
commit `34a0f983`, the revision the bundled binary was pinned to.

## Layout

| File                        | Upstream                                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/constants.ts`          | `Blockchain/Analysis/BlockchainAnalyzer.StdDenoms`, `Helpers/Constants.cs`, `Blockchain/Keys/HdPubKey.DefaultHighAnonymitySet`                     |
| `src/liquidityClue.ts`      | `WabiSabi/Client/LiquidityClueProvider.cs`, `WabiSabiClientLibrary/Controllers/Helpers/LiquidityClueHelper.cs`                                     |
| `src/transaction.ts`        | the `SmartTransaction` / `SmartCoin` / `HdPubKey` surface the analyzer reads and writes, plus `NBitcoinExtensions.{TryGetScriptType,ExtractKeyId}` |
| `src/coinjoinAnalyzer.ts`   | `Blockchain/Analysis/CoinjoinAnalyzer.cs`                                                                                                          |
| `src/blockchainAnalyzer.ts` | `Blockchain/Analysis/{BlockchainAnalyzer,StartingAnonScores}.cs`                                                                                   |
| `src/getAnonymityScores.ts` | `WabiSabiClientLibrary/Controllers/Helpers/GetAnonymityScoresHelper.cs`                                                                            |

`AnalyzeClusters` and the label and cluster machinery are not ported: they never reach the
`get-anonymity-scores` response.

## The scorer is a fold, not a pure function

`GetAnonymityScores` iterates `request.Transactions.Reverse()` — Suite sends newest first,
the binary processes oldest first — mutating a per-address anonymity map as it goes, then
collects per address with **first-write-wins** dedup. An address's reported score is
therefore the value it had right after the transaction that introduced it; later updates
to the same address do not show up in the response.

`BlockchainAnalyzer.analyze` dispatches on own-input / foreign-input / foreign-output
counts into the receive, normal spend, self-spend and coinjoin paths. The coinjoin path
computes three starting scores through `CoinjoinAnalyzer`'s weighted mean and minimum,
with a recursive input sanction to depth three, assigns per virtual output using the
standard denomination table, `IsWasabi2Cj`, the default high anonymity set and the
address-reuse intersection rule, then adjusts the inputs down to the smallest output
anonset. Virtual inputs and outputs are groupings by address, and they are grouped the
same way here.

All of it is IEEE-754 `double`, which JavaScript matches exactly as long as the summation
and comparison order is mirrored — so it is.

## Upstream quirks reproduced deliberately

Each is commented at the site where it is reproduced.

- **External inputs contribute only their count, never their value.** Upstream's
  `ExternalInput` model is `record ExternalInput()` — a record with no fields — so the
  `ScriptPubKey` and `Value` the request carries for them are discarded.
- **The synthetic outpoint counter restarts at zero for every transaction.** Two request
  transactions with the same shape and values therefore get the same synthetic
  transaction hash, which is what the "already processed this transaction" branch of
  `AnalyzeCoinjoinWalletOutputs` keys off. `AnalysisTransaction.id` is built from the same
  content so that it collides in exactly the same cases.
- **`TryGetLargestEqualForeignOutputAmount` is not about the largest.** It returns the
  first foreign virtual output amount, in grouping order, that occurs more than once, and
  treats a `default` of zero as "not found".
- **`CalculateHalfMixedAnonScore` walks the input list until it hits a foreign input**,
  relying on WabiSabi 2 coinjoins ordering inputs by amount. The helper builds its
  synthetic transaction with the wallet's inputs first, so on this path the walk covers
  all of them.
- **`(ulong)Average(...)` truncates** in the liquidity clue, and **`maxSuggestedAmount / 2`
  is integer division**, so an odd max suggested amount rounds the pleb-round threshold
  down.

## Parity

- `src/__fixtures__/getAnonymityScores.json` is the committed upstream integration-test
  vector. Two of its four cases assert ASP.NET model-validation and Newtonsoft
  deserialization failures, which have no in-process equivalent; they are listed in the
  test file rather than silently dropped.
- All six `WalletWasabi.Tests/UnitTests/BlockchainAnalysis/*.cs` suites are ported, driven
  through a port of the `BitcoinFactory` and `AnalyzedTransaction` helpers they use.
- Upstream ships no tests for `LiquidityClueProvider`, so `src/liquidityClue.test.ts` is
  written here and pins the two arithmetic quirks above.
- `BlockchainAnalyzer.StdDenoms` has **79** entries. The issue describing this port says
  78, which is a miscount of the same array; the table here was compared entry by entry
  against upstream.
