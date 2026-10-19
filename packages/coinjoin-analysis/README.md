# @trezor/coinjoin-analysis

TypeScript port of the pure, deterministic parts of
[`WalletWasabi.WabiSabiClientLibrary`](https://github.com/trezor/WalletWasabi): anonymity scoring and
the liquidity clue. Suite used to obtain these values by spawning the bundled ~35 MB .NET binary and
driving it over localhost HTTP, which made them unavailable on web and mobile and impossible to unit
test.

Only the liquidity clue is ported so far; anonymity scoring follows in a separate change. The symbols
that exist for it alone — `DEFAULT_HIGH_ANONYMITY_SET` and `MAX_RECURSION_DEPTH` in
`src/constants.ts`, and the `Analyze*` request and response types in `src/types.ts` — have no
consumer in this package yet.

The port targets **exact parity** with the pinned upstream release, so it must not "fix" upstream
behaviour we disagree with. Divergence is a bug, never a conservative choice — the anonymity set
decides which UTXOs coin control treats as private.

|                  |                                            |
| ---------------- | ------------------------------------------ |
| Upstream release | `release/v15.0`                            |
| Upstream commit  | `34a0f983a527cff36f20c19ad9b0650a02238e38` |
| Reported version | `15.0`                                     |

The package is intentionally dependency-free and free of Node built-ins so that it stays importable
from browser and Hermes targets. Addresses are opaque strings and external outputs are `scriptPubKey`
hex — exactly the shapes the HTTP boundary used — so no bitcoin library is needed.

## Fixtures

Fixtures in `src/__fixtures__/` are labelled by origin:

- captured from the bundled binary, each group recording the `get-version` it was captured against.

Upstream's own vectors (`WalletWasabi.WabiSabiClientLibrary.Tests/IntegrationTests/TestVectors/GetAnonymityScores.json`)
and unit tests (`WalletWasabi.Tests/UnitTests/BlockchainAnalysis/*.cs`) cover anonymity scoring only,
so transcriptions of them arrive with that port.

Captured fixtures age with the binary: bumping `suite/app-assets/files/bin/coinjoin/update.sh` means
re-capturing them against the new binary.
