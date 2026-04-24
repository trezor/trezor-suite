# React Compiler Migration — Discovery Memo

Branch: `feat/react-compiler`
Status: Discovery / pre-implementation
Last updated: 2026-04-24

## TL;DR

The codebase is in good shape for this migration. React 19.2.4 is already in place, there are no class components, no legacy lifecycles, and no hand-rolled `createElement`. The work is mostly _tooling wiring_ across independent build pipelines, not code rewrites.

**Migration is phased into three stages:**

- **Phase 0 — shared setup** (plugin install + ESLint rules). No runtime behavior change.
- **Phase 1 — web/desktop/connect** (webpack + vite + web jest). Skips the highest-risk item (react-native-reanimated worklet ordering) entirely.
- **Phase 2 — suite-native** (Metro + expo babel + native jest).

Each phase is broken into small, independently-shippable steps below. Rough estimate: 1 engineer-week per phase for enablement + tuning. Scale is ~2,400 components across both surfaces (~1,900 web, ~1,400 native).

**Rollout mechanism.** A shared `react-compiler.config.js` at repo root exports an `ENABLED_PATHS` list and a babel `overrides` entry (`reactCompilerBabelOverride`) that the build configs consume. Each step below _expands_ `ENABLED_PATHS` to cover more of the codebase — infrastructure is landed once, then scope is widened progressively without touching build configs again. An `EXCLUDED_PATHS` list lets us carve out problematic subtrees (e.g. `packages/suite/src/hooks/wallet/` contains react-hook-form-heavy form hooks that the compiler breaks).

> **Why overrides, not the plugin's own `sources` option.** `babel-plugin-react-compiler@1.0.0` has an internal null-filename check that throws a Config error for virtual/mock files _before_ its `sources` filter runs — this crashes jest when it encounters certain transforms. Using babel `overrides` with `test: reactCompilerSources` gates the plugin's loading entirely, avoiding the null-filename check. See [plans/react-compiler-follow-ups.md](react-compiler-follow-ups.md).

---

## Why phased is safe

The compiler is wired at the _build_ level, not at the package level. Web and native use fully independent babel pipelines with separate plugin lists, so enabling one leaves the other untouched.

**Shared code in `suite-common/*`** — 20 packages there depend on React (e.g. `suite-common/toast-notifications`, `suite-common/wallet-core`, `suite-common/formatters`) and are imported by both surfaces. Each app's bundler transforms its own copy of these sources, so the same file is compiled on web and remains uncompiled on native until Phase 2. Source code itself is unchanged — no dual-state problem.

**Web-only packages** (confirmed not imported from `suite-native/`): [packages/components](../packages/components), [packages/product-components](../packages/product-components), [packages/connect-explorer](../packages/connect-explorer), [packages/react-utils](../packages/react-utils).

---

## Phase 0 — shared setup

No runtime behavior change. Lays the groundwork for both phases and surfaces any Rules-of-React violations before the compiler is turned on anywhere.

### Already satisfied

- **React 19.2.4 / React Native 0.83.2** — compiler requires React ≥17; we're well past that.
- **JSX automatic runtime** — both webpack ([packages/suite-build/base.webpack.config.ts](../packages/suite-build/base.webpack.config.ts)) and Vite ([packages/suite-build/vite.config.mts](../packages/suite-build/vite.config.mts)) use `@babel/preset-react` with `runtime: 'automatic'`.
- **TypeScript** — root [tsconfig.base.json](../tsconfig.base.json) with `jsx: "preserve"` (delegates to Babel, compiler-friendly).
- **Yarn workspaces** — single root ownership, one place to pin `babel-plugin-react-compiler`.

### Steps

1. **Install `babel-plugin-react-compiler`** at the root. Pin the version.
2. **Flip ESLint rules globally** in [packages/eslint/src/reactConfig.mjs](../packages/eslint/src/reactConfig.mjs): `react-hooks/incompatible-library` and `react-hooks/preserve-manual-memoization` from `off` → `error`. These are Rules-of-React checks — they apply regardless of whether the compiler runtime is on, so enabling globally pre-cleans native code before Phase 2. Rules already ship in `eslint-plugin-react-hooks@7.0.1` (installed) but are explicitly disabled with the now-incorrect comment _"Rule for React Compiler; unlikely to use anytime soon"_.
3. **Fix or baseline any violations the new rules surface.** If there are many, ratchet via `eslint-disable` comments with a TODO, but don't stall Phase 1 on this.

---

## Phase 1 — web / desktop / connect

**Scope:** `packages/suite`, `packages/suite-desktop-ui`, `packages/connect-*`, `packages/components`, `packages/product-components`, `packages/react-utils`.

### Steps

1. **Wire the plugin infrastructure (no behavior change).** Add `babel-plugin-react-compiler` to all four web babel chains — webpack, vite, jest-babel, jest-swc — with `sources` gated to a never-match filter. Lands all config plumbing in a single PR without touching runtime. The "Wiring targets" table below lists the files.
2. **Spike: [packages/product-components](../packages/product-components)** (48 components, low blast radius, consumed by suite). Expand the `sources` filter to this package. Run its tests, check suite renders correctly, **measure bundle delta on the suite web bundle**. Validates styled-components plugin ordering.
3. **[packages/components](../packages/components)** (~157 components). Shared UI, still contained. Same check list: tests + visual spot-check in suite.
4. **[packages/connect-explorer](../packages/connect-explorer) and connect web surfaces.** Different webpack configs and entry points — validates the wiring holds for bundles other than suite.
5. **[packages/suite](../packages/suite)** (~1,690 components, main app). By now the path is proven. Single step is fine; if bundle delta or runtime issues surface, the filter can be narrowed back to a subfolder (e.g. `views/wallet` first) and expanded iteratively.
6. **Remove the Jest `sources` gate.** Lets tests exercise the same compiled output as runtime. Expect some snapshot churn — regenerate and review diffs for anything beyond memoization-identity changes.
7. **Follow-up — manual memoization audit.** With `react-hooks/preserve-manual-memoization` already on (Phase 0), pass through the 211 existing `useMemo`/`useCallback`/`memo` sites in `packages/suite` and remove those now flagged as redundant. Opportunistic, not blocking.

### Wiring targets

| Pipeline           | File                                                                                                                                    | Change                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Web prod (webpack) | [packages/suite-build/base.webpack.config.ts](../packages/suite-build/base.webpack.config.ts)                                           | Add `babel-plugin-react-compiler` to babel-loader plugins, **before** `babel-plugin-styled-components` |
| Web dev (vite)     | [packages/suite-build/vite.config.mts](../packages/suite-build/vite.config.mts)                                                         | Same, inside the `@rolldown/plugin-babel` config                                                       |
| Connect explorer   | [packages/connect-explorer/webpack/webextension.webpack.config.ts](../packages/connect-explorer/webpack/webextension.webpack.config.ts) | Same                                                                                                   |
| Tests (web)        | [jest.config.base.js](../jest.config.base.js) + [jest.config.base.swc.js](../jest.config.base.swc.js)                                   | Wire compiler into both babel-jest and `@swc/jest` transforms                                          |

[suite-native/app/babel.config.js](../suite-native/app/babel.config.js) and [jest.config.native.js](../jest.config.native.js) are untouched in this phase.

### Scale

| Surface                                                               | .tsx files | Components (approx) |
| --------------------------------------------------------------------- | ---------- | ------------------- |
| [packages/suite/src](../packages/suite/src)                           | 1,481      | ~1,690              |
| [packages/components/src](../packages/components/src)                 | 194        | 157                 |
| [packages/product-components/src](../packages/product-components/src) | 71         | 48                  |
| [packages/connect-explorer/src](../packages/connect-explorer/src)     | —          | ~30                 |
| **Phase 1 total**                                                     | **~1,750** | **~1,925**          |

### Risks (Phase 1)

- **styled-components babel plugin ordering** — 374 call sites in suite alone. Compiler plugin must run _before_ `babel-plugin-styled-components`. Current ordering is fine; just preserve it.
- **Dual web build** (webpack prod + vite dev) — both need the plugin or dev/prod behavior will diverge.
- **Two web Jest transforms** (`babel-jest`, `@swc/jest`) — update together.
- **Bundle size delta** — compiler adds runtime helpers per component. Measured on suite-web webpack prod build after step 5 (product-components + components + suite all in `ENABLED_PATHS`): **+800 KB raw / +290 KB gzipped across all JS assets (+3.63% / +4.73%)**. Overhead concentrates in the app chunks; vendor chunks (React, redux, etc.) are byte-identical. Webpack compile time: **44.9s → 62.0s (+38%)**. Not material for a one-shot prod build; acceptable trade for compiler memoization. See [plans/react-compiler-follow-ups.md](react-compiler-follow-ups.md) for raw numbers.
- **Test snapshot churn** — compiler changes render output equivalence, not semantics, but snapshots comparing internals (e.g. prop identity) may need regeneration.

---

## Phase 2 — suite-native

**Scope:** `suite-native/*` (37 packages).

### Steps

1. **Wire the plugin infrastructure (no behavior change).** Add `babel-plugin-react-compiler` to [suite-native/app/babel.config.js](../suite-native/app/babel.config.js) immediately _before_ `react-native-worklets/plugin`, and to [jest.config.native.js](../jest.config.native.js)'s expo preset chain. `sources` filter set to never-match. Single infrastructure PR.
2. **Spike: worklet interaction.** Pick a package with heavy reanimated usage — candidates in [suite-native/atoms](../suite-native/atoms) (animated Stack/Box) or any `suite-native/module-*` with gesture animations. Expand filter to just that package. **This is the single highest-risk step in the whole migration** — verify worklets still compile, animations still run on device, no "value accessed on the JS thread" errors.
3. **[suite-native/atoms](../suite-native/atoms) + foundation packages** (theme, icons, intl, forms). Low-level UI building blocks.
4. **`suite-native/module-*` feature modules.** Can be enabled in groups (accounts, send, trading, onboarding, …) or one at a time if anything regresses. ~20+ modules.
5. **[suite-native/app](../suite-native/app)** (top-level shell) + remaining `suite-native/*` packages.
6. **Remove the native Jest `sources` gate.**
7. **Follow-up — manual memoization audit** across `suite-native/*` (same treatment as Phase 1 step 7).

### Wiring targets

| Pipeline       | File                                                                    | Change                                                                                         |
| -------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Native         | [suite-native/app/babel.config.js](../suite-native/app/babel.config.js) | Add compiler plugin **before** `react-native-worklets/plugin` (worklets plugin must stay last) |
| Tests (native) | [jest.config.native.js](../jest.config.native.js)                       | Add compiler plugin to the `babel-preset-expo` chain                                           |

### Scale

| Surface                                          | .tsx files | Components (approx) |
| ------------------------------------------------ | ---------- | ------------------- |
| [suite-native/\*/src](../suite-native) (37 pkgs) | 1,439      | ~1,400              |

### Risks (Phase 2)

- **`react-native-reanimated` 4.2.1 + worklets 0.7.2** — 40+ suite-native packages depend on it. The worklets babel plugin is intentionally pinned _last_ in [suite-native/app/babel.config.js](../suite-native/app/babel.config.js) with an explanatory comment. Compiler plugin must slot in _before_ worklets. **Single highest-attention item for the whole migration.**
- **jest-expo transform** — verify compiler plugin survives the expo preset chain.

---

## Code-level findings (both phases)

### Manual memoization (follow-up audit, not a blocker)

- `useMemo` × 114, `useCallback` × 73, `memo()` × 24 in `packages/suite/src`.
- Keep on day one — compiler is additive. Audit in a follow-up pass using `react-hooks/preserve-manual-memoization` to guide removal.

### Low-risk code patterns

- **7 `forwardRef` call sites** (mostly [suite-native/atoms](../suite-native/atoms/src)) — compiler handles these; React 19 ref-as-prop migration is an orthogonal cleanup.
- **~20 heuristic "`.current =` outside effect"** sites in `packages/suite/src` — all appear to be synchronous imperative updates in callbacks/effects, not render-phase. Worth spot-checking [Labeling.tsx](../packages/suite/src/components/suite/labeling/Labeling/Labeling.tsx) and [useResponsiveContextOnChange.tsx](../packages/suite/src/components/suite/layouts/SuiteLayout/useResponsiveContextOnChange.tsx) but the ESLint rules will surface any real violations.
- **275 inline `useSelector(state => ...)` selectors** (~28% of 992 total) — not a compiler blocker, but an orthogonal perf opportunity that the compiler will _not_ fix on its own.

### Not a concern

- Class components: **0**
- Legacy lifecycle (`UNSAFE_*`, `componentWillMount`, etc.): **0**
- Hand-rolled `React.createElement`: **0**
- Direct prop/state mutation: **0**

### Known unknowns

- **Redux store + middlewares** ([packages/suite/src/reducers/store.ts](../packages/suite/src/reducers/store.ts), [packages/suite/src/middlewares](../packages/suite/src/middlewares)) — compiler analysis may conservatively skip complex derived state. Measure real behavior; do not pre-emptively add `"use no memo"`.

---

## Third-party compatibility reference

| Library                   | Version | Phase | Notes                            |
| ------------------------- | ------- | ----- | -------------------------------- |
| `@tanstack/react-query`   | 5.90.21 | Both  | Compatible                       |
| `react-redux`             | 9.2.0   | Both  | Compatible                       |
| `react-hook-form`         | 7.71.2  | Both  | Compatible                       |
| `framer-motion`           | 12.33.0 | 1     | Compatible                       |
| `styled-components`       | 6.3.9   | 1     | Babel plugin ordering matters    |
| `react-native-reanimated` | 4.2.1   | 2     | Worklet plugin ordering critical |
