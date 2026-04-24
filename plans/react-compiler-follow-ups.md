# React Compiler — Rules-of-React Follow-ups

Violations surfaced during [Phase 0](react-compiler-migration.md) when the new `react-hooks/incompatible-library` and `react-hooks/preserve-manual-memoization` rules were flipped from `off` → `error`. Each site has a matching `eslint-disable-next-line` comment pointing back to this file.

**Status:** baselined, not fixed. Each entry must be revisited when the compiler runtime is enabled for its surface (Phase 1 for web, Phase 2 for native).

**Total:** 20 sites across 18 files.

---

## `react-hooks/incompatible-library` — react-hook-form usage (11 sites)

**Root cause:** every violation is `useForm()`'s `watch()`/`register()`/`handleSubmit()`/`control`. React Hook Form subscribes to values outside React's state system, so the compiler can't reason about identity stability. Rule message: _"React Hook Form's `useForm()` API returns a `watch()` function which cannot be memoized safely."_

**Resolution strategy:** unlikely to be "fixable" short of migrating off react-hook-form or waiting for an RHF version with compiler-aware types. Expect these to become permanent `"use no memo"` file-level opt-outs when the compiler is enabled for `packages/suite`. When that happens, delete the `eslint-disable-next-line` comments and replace with a `"use no memo"` directive at the top of each file.

- [ ] [packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/StellarTokenInputModal.tsx:40](../packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/StellarTokenInputModal.tsx#L40)
- [ ] [packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/TxSimulationModal/hooks/useTxFeesForm.ts:49](../packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/TxSimulationModal/hooks/useTxFeesForm.ts#L49)
- [ ] [packages/suite/src/components/wallet/Pagination.tsx:123](../packages/suite/src/components/wallet/Pagination.tsx#L123)
- [ ] [packages/suite/src/hooks/settings/backends/useBackendsForm.ts:98](../packages/suite/src/hooks/settings/backends/useBackendsForm.ts#L98)
- [ ] [packages/suite/src/hooks/settings/useExplorerForm.ts:71](../packages/suite/src/hooks/settings/useExplorerForm.ts#L71)
- [ ] [packages/suite/src/hooks/suite/useChangeDeviceLabel.ts:59](../packages/suite/src/hooks/suite/useChangeDeviceLabel.ts#L59)
- [ ] [packages/suite/src/hooks/wallet/sign-verify/useSignVerifyForm.ts:99](../packages/suite/src/hooks/wallet/sign-verify/useSignVerifyForm.ts#L99)
- [ ] [packages/suite/src/hooks/wallet/trading/form/useTradingReceiveAddress.ts:295](../packages/suite/src/hooks/wallet/trading/form/useTradingReceiveAddress.ts#L295)
- [ ] [packages/suite/src/views/wallet/send/SendRaw.tsx:41](../packages/suite/src/views/wallet/send/SendRaw.tsx#L41)
- [ ] [packages/suite/src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/TradingReceiveAddressModal.tsx:82](../packages/suite/src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/TradingReceiveAddressModal.tsx#L82)
- [ ] [suite/suite-sync/src/SelectSuiteSyncServer.tsx:63](../suite/suite-sync/src/SelectSuiteSyncServer.tsx#L63)

---

## `react-hooks/preserve-manual-memoization` — load-bearing memoization (9 sites)

**Root cause:** the compiler cannot guarantee it would reproduce the identity of an existing `useCallback`/`useMemo`. Usually means the memoized value is used in an effect dependency list and changing identity every render would break the effect lifecycle (re-running it, re-creating subscriptions, etc.).

**Resolution strategy:** case by case.

- If the memoized value feeds a `useEffect`: either inline the computation into the effect and depend on the raw inputs, or accept the opt-out.
- If the memoized value is passed as a prop to a memoized child: compiler will likely preserve reference equality automatically; disable comment can be removed and behavior verified.
- Otherwise: keep the opt-out; the compiler may genuinely skip optimization here.

### Web (Phase 1 scope)

- [ ] [packages/components/src/components/Tabs/Tabs.tsx:87](../packages/components/src/components/Tabs/Tabs.tsx#L87) — `updateIndicator` callback consumed by a ResizeObserver effect; callback identity change would re-create the observer every render.
- [ ] [packages/suite/src/components/earn/yield/hooks/useResolvedYieldFlowData.ts:31](../packages/suite/src/components/earn/yield/hooks/useResolvedYieldFlowData.ts#L31)
- [ ] [packages/suite/src/hooks/wallet/form/useCoinjoinRegisteredUtxos.ts:21](../packages/suite/src/hooks/wallet/form/useCoinjoinRegisteredUtxos.ts#L21)
- [ ] [packages/suite/src/hooks/wallet/form/useCoinjoinUnavailableUtxos.ts:32](../packages/suite/src/hooks/wallet/form/useCoinjoinUnavailableUtxos.ts#L32)
- [ ] [packages/suite/src/hooks/wallet/useAccounts.ts:8](../packages/suite/src/hooks/wallet/useAccounts.ts#L8)
- [ ] [packages/suite/src/views/wallet/trading/common/TradingForm/TradingSellFormInputs.tsx:69](../packages/suite/src/views/wallet/trading/common/TradingForm/TradingSellFormInputs.tsx#L69) (2 hits on the same line)

### Native (Phase 2 scope)

- [ ] [suite-native/graph/src/hooks.ts:111](../suite-native/graph/src/hooks.ts#L111)
- [ ] [suite-native/module-stellar-token-management/src/hooks/useInactiveStellarTokens.ts:43](../suite-native/module-stellar-token-management/src/hooks/useInactiveStellarTokens.ts#L43)

---

## When to revisit

- Before Phase 1 step 2 (spike on `packages/product-components`) — nothing here, but verify the spike package stays clean.
- Before Phase 1 step 3 (`packages/components`) — address the single Tabs.tsx entry.
- Before Phase 1 step 5 (`packages/suite`) — address or confirm opt-out for all remaining web entries.
- Before Phase 2 step 4 (module rollout) — address the two native entries.

---

## Post-step-5 regressions discovered

### 1. `useRbfForm.test.tsx` — 2 DOM assertion failures

**Surface:** Full suite battery after Phase 1 step 3 enabled `packages/components/` compilation. The 2 failing tests assert that `[data-testid="@send/decreased-outputs"]` renders after `composedLevels` updates; post-compile it doesn't appear.

Tests:

- `useRbfForm hook › composeAndSign: new utxo is not enough to cover even the lowest fee. decreasing output instead.`
- `useRbfForm hook › composeAndSign: output decreased. there is no change or new utxo.`

**Isolation performed:**

- Only `packages/product-components/` compiled → RBF test passes.
- Add `packages/components/` → RBF test fails (both assertions).
- Add `packages/suite/` on top → same 2 failures, no new regressions from step 5.
- File-level `"use no memo"` on `useRbfForm.ts` + `useCompose.ts` did not fix (effect dep chain spans too many files).

**Hypothesis:** a hook or component in `packages/components/` (imports from DecreasedOutputs.tsx: `Banner`, `Card`, `Column`, `Divider`, `Icon`, `RadioCard`, `Row`, `Text`, `TextButton`; plus `useElevation`) has identity-sensitive behavior that the compiler breaks. Further binary search through [packages/components/src](../packages/components/src) needed.

**Follow-up options:**

- Binary-search the culprit component, opt it out with `"use no memo"`.
- OR exclude `packages/suite/src/hooks/wallet/` from compilation (already done in `EXCLUDED_PATHS`), and ALSO exclude `packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/TxDetailModal/` to break the RBF rendering path.
- OR accept the regression until an easier reproducer surfaces.

### 2. `EXCLUDED_PATHS` baseline

`react-compiler.config.js` currently excludes `packages/suite/src/hooks/wallet/` — this protects form hooks (`useSendForm`, `useCompose`, `useRbfForm`, `useFees`, trading forms, etc.) from compilation. Revisit when the compiler's react-hook-form handling matures. Ideally each file gets its own `"use no memo"` directive and this path is removed from the exclusion list.

### 3. `babel-plugin-react-compiler` null-filename bug

When wiring the compiler into jest's babel chain, using the plugin directly in the `plugins` array with a `sources` function caused jest to throw a Config error on virtual/mock files (null filename) — even though `sources` returned false for them. The plugin's own null-filename check runs _before_ the filter is called and throws unconditionally. Workaround: use babel `overrides` with the same `test: reactCompilerSources` function. `overrides` gate the plugin's loading entirely, bypassing the null-filename check. See `reactCompilerBabelOverride` in `react-compiler.config.js`.

---

## Webpack prod build — bundle-size delta (Phase 1 step 5)

Measured by building `@trezor/suite-web` twice on commit `4c16f95b49` with the step-5 uncommitted state:

1. **Baseline:** `ENABLED_PATHS = []` (compiler wired but compiles nothing — equivalent to pre-Phase-1 state).
2. **Compiler:** `ENABLED_PATHS = ['packages/product-components/', 'packages/components/', 'packages/suite/']` with `EXCLUDED_PATHS = ['packages/suite/src/hooks/wallet/']`.

Both builds: `NODE_ENV=production`, webpack 5.105.4, fresh cache.

| Metric                          | Baseline      | Compiler      | Delta                |
| ------------------------------- | ------------- | ------------- | -------------------- |
| JS raw (sum of all `js/*.js`)   | 22,032,936 B  | 22,833,433 B  | **+800 KB / +3.63%** |
| JS gzipped (concat \| gzip -9)  | 6,148,975 B   | 6,439,531 B   | **+290 KB / +4.73%** |
| Whole `build/` (all assets)     | 115,362,885 B | 117,789,354 B | +2.4 MB / +2.10%     |
| JS file count                   | 210           | 211           | +1                   |
| Webpack compile (`compiled in`) | 44.9 s        | 62.0 s        | +17.1 s (+38%)       |

**Observations.**

- The largest chunk (~8.44 MB, vendor) is byte-identical across builds → compiler correctly scoped to `packages/*` sources, node_modules untouched.
- Overhead concentrates in the app chunks: the 2nd-largest chunk grew +513 KB (+11.2%) and a few medium-sized app chunks grew 20–35%. This matches the expected "compiler emits memoized wrappers per component" pattern.
- +4.73% gzipped across ~1,925 components is in the expected range for React Compiler output. Usually offset at runtime by eliminated re-renders, but this measurement doesn't capture runtime savings.
- Compile-time regression (+38%) is significant for dev builds; compiler does extra analysis per file. Worth re-measuring with vite dev once step 6 removes the jest `sources` gate.

**Logs:** `/tmp/claude/rc-bundle/{baseline,compiler}.{stats.txt,build.log}` (ephemeral).
