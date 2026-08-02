# gnhf loop prompt — provable backend-request optimization (DRAFT)

Feed this to gnhf on the branch `mroz22/blockchain-link-request-baseline` with:
`gnhf --current-branch --max-iterations 60 --stop-when "all coins in COIN_ORDER have hit 10 iterations" "$(cat suite/e2e/scripts/bcl/loop-prompt.md)"`

---

## Mission
You reduce the number of network requests Trezor Suite sends to blockchain backends, ONE coin at a
time, and you keep a change ONLY when it PROVABLY lowers the request count in CI without breaking the
wallet. You are running unattended. Being honest and conservative matters more than making progress:
a wrongly-accepted change is far worse than a skipped iteration.

## Absolute rules (violating any = report success:false immediately)
1. NEVER edit the measurement "ruler". Run `bash suite/e2e/scripts/bcl/off-limits-guard.sh` before you
   report; if it exits non-zero, discard your change and report success:false. Off-limits includes:
   the discovery test, bcl-golden.json, suite/e2e/scripts/bcl/*, the 3 taps (backend-request-logger.ts
   and the `__bclWrite__` blocks in blockchain-link/src/index.ts + websocket-client/src/client.ts),
   .github/workflows/template-suite-run-e2e.yml + test-suite-web-desktop-e2e-pr.yml + bcl-deploy-viewer.yml,
   .context/bcl-analyze.mjs, and BCL_COINS / BCL_IDLE_MS / BCL_GOLDEN.
2. NEVER weaken correctness: do not lower a golden baseline, disable/skip a test, shorten idle, reduce
   the coin set, or make the app degrade liveness/visibility to fake a lower idle count.
3. EXACTLY ONE targeted production-code change per iteration. Small and reviewable.
4. Success is decided by CI measurement, not by your intuition. If you cannot measure, report success:false.

## Cross-iteration state — `.context/bcl-loop-state.json` (GITIGNORED — survives gnhf's reset --hard)
This is your memory; gnhf's notes.md is discarded on a rejected iteration, this file is NOT. Read it
first, write it last, every iteration (success OR failure).
Shape:
```
{
  "coinOrder": ["btc","eth","sol","ada","trx"],
  "currentCoinIndex": 0,
  "iterations": { "btc": 0, "eth": 0, ... },        // count per coin, cap 10
  "best":       { "btc": {"wire": 96, "commit": "<sha>"}, ... },  // best accepted median per coin
  "tried":      { "btc": [ {"hypothesis":"...", "result":"rejected: no delta / broke correctness / +noise", "afterMedian": 95} ] },
  "rulerHash": "<sha256 of the immutable set>"
}
```
If the file is missing, initialize it (currentCoinIndex 0, all iterations 0, best empty, tried empty).

## Per-iteration algorithm
0. Read `.context/bcl-loop-state.json`. Let `coin = coinOrder[currentCoinIndex]`.
1. If `iterations[coin] >= 10` OR you have no untried, promising hypothesis for `coin`: advance
   `currentCoinIndex`, write state, and (if there is a next coin) continue with the new coin; if no coin
   is left, report success:false and stop.
2. INTEGRITY: `git status` must be clean; run the off-limits guard on a clean tree; recompute the ruler
   hash and confirm it equals `state.rulerHash` (compute it as
   `git hash-object suite/e2e/tests/wallet/discovery.test.ts suite/e2e/tests/wallet/bcl-golden.json suite/e2e/scripts/bcl/aggregate.mjs packages/suite-desktop-core/src/modules/backend-request-logger.ts | sha256sum`).
   Any mismatch → the ruler was tampered → report success:false and stop.
3. BASELINE for this coin = `state.best[coin].wire` if present, else the committed baseline (measure the
   clean tree once via steps 6-8 if you have no baseline number yet, and store it).
4. Pick ONE untried hypothesis for `coin` (see "Hotspot map"). Make ONE targeted change to PRODUCTION
   code only. Never touch ruler files.
5. GUARD: `bash suite/e2e/scripts/bcl/off-limits-guard.sh`. Non-zero → discard, record the (illegal)
   attempt, report success:false.
6. MEASURE (N=3): commit your change to a scratch branch and force-push it, then trigger 3 parallel runs:
   ```
   git add -A && git commit -m "bcl-loop candidate: <coin> <hypothesis>" --no-verify
   git push -f origin HEAD:bcl-loop/candidate
   for i in 1 2 3; do gh workflow run test-suite-web-desktop-e2e-pr.yml --ref bcl-loop/candidate; sleep 5; done
   git reset --soft HEAD~1   # keep the change in the working tree; gnhf owns the real commit
   ```
   Wait for all 3 runs (poll `gh run list --branch bcl-loop/candidate`).
7. CORRECTNESS: every one of the 3 runs must conclude `success` (green). Green means the discovery
   correctness gate passed for ALL coins including `coin` (history.total >= golden, no failed/empty).
   If ANY run is red or errored (not merely infra-flaky — retry a flaky infra failure up to 2x), the
   change broke correctness → discard, record "rejected: broke correctness", report success:false.
8. COUNT: for each green run, `gh run download <id> -n bcl-log-*` and read `coin`'s TOTAL backend wire
   requests = `discovery.wire + idle.wire` from `node suite/e2e/scripts/bcl/aggregate.mjs` output (or
   .context/bcl-analyze.mjs). Take the MEDIAN of the 3.
9. WIN TEST — accept ONLY if ALL hold:
   - `medianAfter < baseline` by more than the noise band for this coin: require
     `medianAfter <= baseline - max(ceil(baseline*0.05), 5)` (must beat ~5% AND at least 5 absolute requests);
   - all 3 runs green (step 7);
   - no OTHER coin's wire count moved outside ±10% vs its own best (single-coin change must not disturb
     other coins);
   - the off-limits guard passed.
10. DECIDE:
    - WIN → update `state.best[coin] = {wire: medianAfter, commit: "<pending>"}`, append the accepted
      hypothesis to `state.tried[coin]`, `iterations[coin]++`, write state; LEAVE the change in the
      working tree; write a one-line notes.md summary; report success:true (gnhf commits it).
    - LOSE → append the rejected hypothesis + afterMedian to `state.tried[coin]`, `iterations[coin]++`,
      write state; `git checkout -- .` to discard the change; report success:false (gnhf resets).
11. CLEANUP: delete the scratch branch (`git push origin --delete bcl-loop/candidate || true`).
12. SELF-REPORT JSON must include: coin, hypothesis, baseline, medianAfter, deltaPct, allGreen (bool),
    guardOk (bool), decision.

## Fitness (what "the number" is)
Per current coin, single-coin-only (the test enables only that coin): the ABSOLUTE total backend wire
requests `discovery.wire + idle.wire` for that coin, MEDIAN over 3 CI runs. Lower is better. NOT amp
(a gameable ratio), NOT logical count, NOT idle-rate alone. A change that lowers requests but turns any
run red (correctness) is a LOSS.

## Hotspot map (seed hypotheses — verify before assuming; don't touch ruler)
- **trx / eth idle:** `onBlockMinedThunk` (suite-common/wallet-core/src/blockchain/blockchainThunks.ts)
  suppresses per-block whole-coin resync only when `isNetworkUsingExternalBackend(symbol)` is true. trx's
  networksConfig backendOptions lack `isExternalBackend` → every ~3s TRON block triggers a full
  getAccountInfo resync (measured 428 req/10min idle). Likely fix: flag trx's backend as external, or
  narrow the resync. ETH idle (60/min) is the same family of problem — confirm whether EVM is actually
  suppressed.
- **Per-block / per-notification resync:** `onBlockchainNotificationThunk` re-syncs the WHOLE coin though
  it knows the affected `descriptor` — narrow to the single account.
- **sol discovery fan-out:** one logical getAccountInfo explodes into ~113 backend calls (getTransaction
  ×49, getProgramAccounts ×2 incl. a redundant full scan, uncached ATA-owner lookups). Defer
  staking/token probing during emptiness probing; dedup.
- **Periodic sync timer / fiat batching / keep-alive ping** — see .context/blockchain-link-optimization-map.md.

## Notes
- Do NOT publish anything to the shared dashboard; you read counts from run artifacts, not sldev.
- If a hypothesis needs a change to a shared file that also contains a tap (blockchain-link/src/index.ts,
  websocket-client/src/client.ts), you MAY edit the file but MUST NOT touch the `__bclWrite__` block (the
  guard enforces this).
- Prefer the highest-confidence, most-isolated change; record every tried hypothesis so you never repeat one.
```
