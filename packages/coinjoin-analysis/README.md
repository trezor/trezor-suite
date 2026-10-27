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

### Re-capturing

The binary is bundled per platform at
`suite/app-assets/files/bin/coinjoin/<platform>/WalletWasabi.WabiSabiClientLibrary` (`linux-x64`,
`linux-arm64`, `mac-x64`, `mac-arm64`, `win-x64`). It takes its port from `WCL_BIND_PORT` — there is
no command-line argument for it — and every endpoint is a `POST` of a JSON body:

```sh
cd suite/app-assets/files/bin/coinjoin/linux-x64
WCL_BIND_PORT=37128 ./WalletWasabi.WabiSabiClientLibrary &

# Goes into LIQUIDITY_CLUE_BINARY_VERSION and the fixture file's header comment.
curl -s -X POST localhost:37128/get-version -H 'Content-Type: application/json' -d '{}'
# {"Version":"15.0","CommitHash":"34a0f983a527cff36f20c19ad9b0650a02238e38","Debug":false}

curl -s -X POST localhost:37128/init-liquidity-clue -H 'Content-Type: application/json' \
    -d '{"ExternalAmounts":[5000,5000,10000,20000,1234]}'
# {"RawLiquidityClue":20000}

curl -s -X POST localhost:37128/update-liquidity-clue -H 'Content-Type: application/json' \
    -d '{"RawLiquidityClue":50000,"MaxSuggestedAmount":1000000,"ExternalAmounts":[20000,20000,10000]}'
# {"RawLiquidityClue":20000}

curl -s -X POST localhost:37128/get-liquidity-clue -H 'Content-Type: application/json' \
    -d '{"RawLiquidityClue":1000000,"MaxSuggestedAmount":20000}'
# {"LiquidityClue":20000}
```

Those three calls are the `request`/`response` of existing fixtures verbatim — each fixture's
`request` is the body to post and its `response` is what the binary must answer. Replaying every
`request` in `liquidityClue.fixture.ts` therefore both re-captures a group and proves the old set
was not stale.
