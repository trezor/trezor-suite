# Runtime QA fixture provenance

All account data in runtime captures comes from disposable local fixtures. Balances, totals, history, fees, prices, offers and APYs illustrate interface states; they are not live-chain or current commercial information. The structured [fixture manifest](./fixtures.json) records source paths, local endpoints, adapter hashes and limitations without confidential values.

## Local blockchain responses

| Network | Loopback endpoint        | Provenance and practical limit                                                                                                                                                             |
| ------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BTC     | `ws://127.0.0.1:22001`   | synthetic-local-chain-state. No real-chain funding, confirmation or transaction validation.                                                                                                |
| ETH     | `ws://127.0.0.1:22002`   | existing-e2e-fixtures. Static historical and staking states; no actual activation, claiming or transfer is established.                                                                    |
| ADA     | `ws://127.0.0.1:22003`   | existing-e2e-fixtures. The common ETH/SOL QA seed used in this runtime session does not match the separate Cardano funded mnemonic fixture; the observed Cardano account remains unfunded. |
| SOL     | `http://127.0.0.1:22004` | adapted-e2e-rpc-fixture. Default stake-account state is empty; optional control modes are available but not evidence of a captured journey unless recorded separately.                     |
| TRX     | `ws://127.0.0.1:22005`   | existing-e2e-fixtures. Freeze/resource entry and provider consent are inspectable; this does not establish executed freezing, representative votes or reward collection.                   |

Bitcoin uses descriptor-derived synthetic transactions/UTXOs, funded independently for account zero of each account type. Multiple account types therefore do not represent additive real holdings. Bitcoin history graphs can remain empty despite visible axes. ETH and Tron reuse their E2E endpoint fixtures. Cardano is unfunded for the shared ETH/SOL seed used here; its separate funded mnemonic fixture was not loaded for this pass.

Solana adapts its E2E RPC mock with local discovery and empty/error fallbacks. Populated signature history and Earn reward-history/total routes are not implemented. The inherited local transaction method may return a synthetic signature, but cannot broadcast upstream. No actual signing/broadcast was used as evidence.

## Trading, Yield and Earn

Trading positive E2E responses are live observations, not checked-in offline offers. The adapter instead uses existing unit-fixture schemas, the eight-asset catalog and two platform definitions. It normalizes requested assets/amounts to illustrative quotes from one visibly named **Local QA Provider**. Conversion ratios intentionally differ from displayed backend fiat prices. Card/bank entries, a centralized floating-rate offer and empty fixed-rate sections are fixture states. Provider checkout, KYC, payment, order creation, signing and confirmation are locally unavailable.

Yield reuses the complete three-vault E2E catalog and its filter/detail behavior. Merkl rewards are empty. Initial wrap/approval forms and step labels do not establish allowances, deposits, withdrawals, redemption or claims. Earn staking reuses static batch rates/timings, with valid public provider identities taken from the application registry. An abbreviated unit-test Cardano identifier initially triggered a QA-only bech32 error; the adapter was corrected and its error capture explicitly retained.

## Adapter and emulator isolation

Scripts remain under `/tmp/feature-map-runtime`; SHA-256 fingerprints and roles are in the JSON manifest. No application source was modified. Blockchain servers bind loopback and have no external passthrough. The Playwright helper routes exact production/staging/dev API hosts and fails matched unknown operations locally. Browser-wide external-traffic blocking is a separate root-controller responsibility.

The task-only TUE copy uses fresh profiles. The shared ETH/SOL QA phrase is read directly into memory from the existing test property and is not copied here. Model transitions require Suite at `about:blank`, bridge stopped, then explicit wiped-emulator setup before bridge restoration. A session-acquisition deadlock was recovered by restarting only the guarded task controller subtree. Original TUE profiles remain untouched.

## Verification limits

Local contract checks validate response shapes, pool bech32 checksums, route selection and blocked upstream behavior. Screenshots validate their visible UI only. No successful real-chain transaction, stake, yield operation or provider trade is claimed. Missing local fixtures do not imply missing application features.

## Active fixture checkpoint: deeper staking

The root audit agent subsequently stopped only the original task backend and activated `mock-backends-with-staking-modes.cjs` on the same loopback ports. This checkpoint is root-reported activation plus locally recorded script hashes; the QC agent did not operate the live services. The JSON retains all original provenance and adds candidate/mode/wrapper fingerprints and exact source paths.

Solana moved through explicit **staked → unstaking** fixture modes; Tron through **rewarded → withdrawable** modes. Their later screenshots show the corresponding dashboards and entry forms. These changes were injected E2E states, not completed transactions. Solana reward history still shows loading placeholders because the local history endpoints remain unavailable.

Root then initialized a separate Cardano academic-fixture wallet and reported a funded account. Cardano UI was not yet part of the reviewed 207–228 snapshot. Earlier statements that Cardano was unfunded describe the previous shared ETH/SOL-seed phase and remain preserved as historical context. Later Cardano screenshots require their own visual review.

The candidate retains strict original descriptor/address guards. It never assigns academic-fixture UTXOs or stake credentials to an unrelated seed. Tron and Cardano account states reuse exact E2E builders/updates; Cardano pool/stake checksums are validated locally. No seed words, descriptors, addresses, balances or transaction IDs are copied into this checkpoint. Synthetic pricing limits and the prohibition on treating fixture state as real transaction execution continue to apply.

## Cardano checkpoint: funded and rewarded UI observed

The final ten captures (229–238) now visually confirm the separate academic Cardano fixture in a fresh app profile, through **funded → rewarded** modes. This resolves the earlier pending-Cardano-UI checkpoint without rewriting its historical status. Intro/consent/delegation/voting forms and rewarded dashboard/claim/unstake controls are visible. No delegation, claim, undelegation, DRep transaction or message signing was submitted.

The candidate retains its exact academic-descriptor guard and original E2E UTXO/stake metadata. Updated wrapper/mode file fingerprints and source references are appended to the JSON. No seed, account identity, amount or transaction values are included. The separate shared ETH/SOL/TRX fixture profile is not conflated with this Cardano wallet.

Visual and source review also established that dashboard **Change delegate** opens governance **Change voting preference**, not a staking-pool provider update. The separate provider-migration feature remains uncaptured by this batch. Read [Cardano visual QC](./screenshot-quality-cardano.md) for the additive association correction and all ten per-image limits.
