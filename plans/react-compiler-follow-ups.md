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
