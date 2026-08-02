# gnhf TEST prompt — validate the loop end-to-end on ONE known-good trx change

Run (on branch mroz22/blockchain-link-request-baseline, AFTER the current validation CI run finishes):
`gnhf --current-branch --max-iterations 1 "$(cat suite/e2e/scripts/bcl/loop-test-prompt.md)"`

This is a ONE-ITERATION mechanics test. It applies a single KNOWN optimization to TRON only, measures
it in CI, and keeps it only if the request count provably drops without breaking the wallet. Success
here proves the whole loop (scratch-ref measurement, parallel CI, correctness gate, keep/revert,
gitignored state) works before the real weekend run.

## Hard rules
- Change ONLY production code. NEVER edit the measurement ruler; before reporting, run
  `bash suite/e2e/scripts/bcl/off-limits-guard.sh` and if it is non-zero, `git checkout -- .` and report
  success:false.
- Make EXACTLY the one change described below. Do not touch anything else.
- The decision is made by CI numbers, not intuition. If you cannot measure, report success:false.

## The change (TRON idle per-block resync)
`onBlockMinedThunk` in `suite-common/wallet-core/src/blockchain/blockchainThunks.ts` skips the per-block
whole-coin resync only for networks where `isNetworkUsingExternalBackend(symbol)` is true (that flag comes
from a backendOption `isExternalBackend: true`). TRON (`trx`) runs on the metered public backend
`tron.trezor.io` but its `networksConfig` backendOptions do NOT carry `isExternalBackend`, so every ~3s
TRON block triggers a full `getAccountInfo` resync (measured ~428 requests over a 10-min idle).

Apply the smallest correct fix that makes `isNetworkUsingExternalBackend('trx')` true (i.e. mark trx's
blockbook backendOption in `suite-common/wallet-config/src/networksConfig.ts` as an external backend),
OR, if that has unwanted side effects, narrow `onBlockMinedThunk` so trx is covered by the fast-network
suppression. Verify your reasoning by reading both files first. Do not change behaviour for other coins.

## Measure (in CI) and decide
1. `bash suite/e2e/scripts/bcl/off-limits-guard.sh` (must be clean).
2. Commit to a scratch branch and trigger the measurement, then keep the change uncommitted for gnhf:
   ```
   git add -A && git commit -m "bcl-loop TEST candidate: trx isExternalBackend" --no-verify
   git push -f origin HEAD:bcl-loop/candidate
   gh workflow run test-suite-web-desktop-e2e-pr.yml --ref bcl-loop/candidate
   git reset --soft HEAD~1
   ```
3. Wait for the run to finish (`gh run list --branch bcl-loop/candidate`). It MUST conclude `success`
   (green = the discovery correctness gate passed for all coins incl. trx: history.total >= golden, no
   failed/empty account). If it is red, the change broke correctness → `git checkout -- .`, report
   success:false with the failure detail.
4. `gh run download <id> -n bcl-log-<...>` and read TRON's total backend wire requests
   `discovery.wire + idle.wire` via `node suite/e2e/scripts/bcl/aggregate.mjs <log>` (trx row).
5. Compare to the trx baseline (from the latest committed baseline run, ~ discovery 18 + idle 428 = ~446
   total; confirm the exact current baseline from the most recent green run on the loop branch before this
   change). WIN if trx total dropped by more than max(5%, 5 requests) AND the run was green AND no other
   coin moved outside ±10%.
6. WIN → leave the change in the working tree, write a one-line notes.md summary, and record the result in
   `.context/bcl-loop-state.json` (gitignored, survives revert): `{"test":{"trx":{"baseline":<n>,"after":<n>,"accepted":true}}}`.
   Report success:true. gnhf commits it.
   LOSE → `git checkout -- .`, record the result in `.context/bcl-loop-state.json`, report success:false.
7. Cleanup: `git push origin --delete bcl-loop/candidate || true`.

## Self-report JSON must include
`{ coin:"trx", change:"<what you did>", baseline:<n>, after:<n>, deltaPct:<n>, green:<bool>, guardOk:<bool>, decision:"keep|revert" }`
