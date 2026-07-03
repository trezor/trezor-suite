# TypeScript Performance Improvement Plan

## Context

The TypeScript language service is likely slowed down by public types that force the compiler to repeatedly expand large unions, recursive conditional types, generated schema types, and route/event maps. The initial investigation found these likely hotspots:

- Translation key types in `suite/intl` and `suite-native/intl`.
- Generated Zod API definitions in `suite-common/earn-stablecoin-defs`.
- Route types derived from `routes as const`.
- Connect/protobuf/analytics event and message unions.

The goal is to reduce type-checking and IDE work while preserving useful type safety at authoring boundaries.

## Measurement Protocol

Run all measurements from the repository root on a clean worktree.

Before measuring each step:

```bash
yarn nx reset
find . -path '*/libDev' -type d -prune -exec rm -rf {} +
```

Use the same Node version and TypeScript version for all runs. Run each command three times and compare medians, not a single run.

Record these metrics:

- `Total time`
- `Check time`
- `Types`
- `Instantiations`
- `Memory used`
- Size of generated `.d.ts` files where relevant

Recommended baseline commands:

```bash
yarn run -T tsc --build suite/intl/tsconfig.json --extendedDiagnostics --force
yarn run -T tsc --build suite-native/intl/tsconfig.json --extendedDiagnostics --force
yarn run -T tsc --build suite/router/tsconfig.json --extendedDiagnostics --force
yarn run -T tsc --build suite-common/earn-stablecoin-defs/tsconfig.json --extendedDiagnostics --force
yarn run -T tsc --build packages/protobuf/tsconfig.json --extendedDiagnostics --force
yarn run -T tsc --build packages/connect-common/tsconfig.json --extendedDiagnostics --force
yarn run -T tsc --build suite-common/analytics/tsconfig.json --extendedDiagnostics --force
yarn run -T tsc --build suite/analytics/tsconfig.json --extendedDiagnostics --force
yarn run -T tsc --build suite-native/analytics/tsconfig.json --extendedDiagnostics --force
```

Declaration size checks:

```bash
wc -c suite/intl/libDev/src/messages.d.ts
wc -c suite-native/intl/libDev/src/messages.d.ts
wc -c suite-native/intl/libDev/src/types.d.ts
wc -c suite/router/libDev/src/route.d.ts suite/router/libDev/src/routes.d.ts
wc -c suite-common/earn-stablecoin-defs/libDev/src/api/index.d.ts
```

IDE responsiveness check:

1. Open a common consumer file for the changed area.
2. Restart the TypeScript server.
3. Trigger completion on the affected API, for example translation `id`, route `name`, or API response type.
4. Record whether completion appears quickly and whether hover/type display is readable.

This IDE check is subjective, so only use it as supporting evidence. The compiler diagnostics and declaration sizes are the main acceptance data.

## Step 1: Generate Flat Translation Key Types

### Problem

`suite-native/intl/src/types.ts` computes `TxKeyPath` with recursive template-literal types over `typeof messages`. Desktop `suite/intl` computes `TranslationKey` from `keyof typeof messages`. These types are imported widely and force consumers to load large message declarations.

### Action

Create generated flat type files:

- `suite/intl/src/generated/translationKeys.ts`
- `suite-native/intl/src/generated/translationKeys.ts`

The generated files should export unions only:

```ts
export type TranslationKey = 'TR_404_DESCRIPTION' | 'TR_404_GO_TO_DASHBOARD';
export type TxKeyPath = 'generic.buttons.cancel' | 'generic.buttons.close';
```

Update:

- `suite/intl/src/types.ts` to import/export generated `TranslationKey`.
- `suite-native/intl/src/types.ts` to import/export generated `TxKeyPath`.

Keep runtime `messages` unchanged.

Add or update a generator script that fails if generated keys are out of sync with `messages`.

### Verification

Functional checks:

```bash
yarn nx run @suite/intl:type-check
yarn nx run @suite-native/intl:type-check
```

Performance checks:

```bash
yarn run -T tsc --build suite/intl/tsconfig.json --extendedDiagnostics --force
yarn run -T tsc --build suite-native/intl/tsconfig.json --extendedDiagnostics --force
wc -c suite/intl/libDev/src/messages.d.ts
wc -c suite-native/intl/libDev/src/messages.d.ts suite-native/intl/libDev/src/types.d.ts
```

Expected improvement:

- Lower `Types` and `Instantiations` for translation packages and consumers.
- `suite-native/intl/libDev/src/types.d.ts` no longer contains `RecursiveKeyOf`.
- Translation key completion still works in `Translation` and `useTranslation`/`useTranslate`.

Failure signal:

- Generated key unions drift from runtime `messages`.
- Translation completion disappears or becomes plain `string`.

## Step 2: Stop Exporting Full Translation Message Shapes

### Problem

Even with flat key unions, exporting `messages` from `@suite/intl` and `@suite-native/intl` can pull very large object declarations into consumers.

### Action

Split public API exports from internal message exports:

- Keep `messages` available from an explicit internal path if needed.
- Avoid re-exporting `messages` from package-level `index.ts` unless consumers truly need the full object.
- Provide helper APIs for common needs, for example `isTranslationKey`, `getTranslation`, and translation components.

### Verification

Search for consumers:

```bash
rg -n "import .*messages|from '@suite/intl'.*messages|from '@suite-native/intl'.*messages" suite packages suite-common suite-native
```

Functional checks:

```bash
yarn nx run @suite/intl:type-check
yarn nx run @suite-native/intl:type-check
yarn type-check --no-tui
```

Performance checks:

```bash
yarn run -T tsc --build suite/intl/tsconfig.json --extendedDiagnostics --force
yarn run -T tsc --build suite-native/intl/tsconfig.json --extendedDiagnostics --force
wc -c suite/intl/libDev/src/index.d.ts suite-native/intl/libDev/src/index.d.ts
```

Expected improvement:

- Package-level `index.d.ts` no longer exposes the full message object unless explicitly intended.
- Consumers that only need `TranslationKey` or `TxKeyPath` do not load full message declarations.

Failure signal:

- Tests or scripts that intentionally need all messages can no longer import them from a stable path.

## Step 3: Hide Generated Zod Schema Internals

### Problem

`suite-common/earn-stablecoin-defs/src/api/index.ts` is generated and exposes very large `zod.ZodObject<...>` declarations. The generated `.d.ts` is large and expensive for consumers.

### Action

Prefer one of these approaches:

1. Configure Orval to emit cleaner separated schemas and model types.
2. Post-process generated exports so public schema declarations are annotated as `zod.ZodType<NamedType>` where possible.
3. Split the generated API into smaller modules by endpoint/domain and expose only required public exports from `index.ts`.

Example target shape:

```ts
export type TokenDto = {
    symbol: string;
    name: string;
    decimals: number;
};

export declare const TokenDto: zod.ZodType<TokenDto>;
```

### Verification

Functional checks:

```bash
yarn nx run @suite-common/earn-stablecoin-defs:type-check
rg -n "zod\\.input<typeof|zod\\.output<typeof" suite-common/earn-stablecoin-defs/src/api
```

Performance checks:

```bash
yarn run -T tsc --build suite-common/earn-stablecoin-defs/tsconfig.json --extendedDiagnostics --force
wc -c suite-common/earn-stablecoin-defs/libDev/src/api/index.d.ts
```

Expected improvement:

- Smaller `index.d.ts`.
- Lower `Types`, `Instantiations`, and `Memory used` for the generated package and direct consumers.
- Runtime validation behavior remains unchanged.

Failure signal:

- Zod parser input/output types become inaccurate.
- Generated file becomes hard to regenerate or maintain.

## Step 4: Simplify Public Router Types

### Problem

`suite/router/src/route.ts` exposes `Route` as a computed union derived from `typeof routes`, `ConstWithOptionalFields`, and `KeysOfUnion`. This keeps route config type-safe but leaks a large computed type into consumers.

### Action

Keep `routes as const` for config validation, but generate or define simpler public aliases:

```ts
export type RouteName = 'suite-index' | 'wallet-index';
export type Route = {
    name: RouteName;
    pattern: string;
    app: string;
    params?: readonly string[];
};
```

For places that need exact route-name-to-param correlation, create targeted helper types rather than using the full computed union everywhere.

### Verification

Functional checks:

```bash
yarn nx run @suite/router:type-check
yarn nx run @suite/router-config:type-check
```

Performance checks:

```bash
yarn run -T tsc --build suite/router/tsconfig.json --extendedDiagnostics --force
wc -c suite/router/libDev/src/route.d.ts suite/router/libDev/src/routes.d.ts
```

IDE checks:

- Completion for route names still works.
- Route navigation helpers still reject invalid route names.
- Common consumer hovers no longer expand a very large route union.

Expected improvement:

- Lower type expansion in router consumers.
- Smaller and more readable router declarations.

Failure signal:

- Route params lose useful validation in navigation call sites.
- More `as` casts appear in router consumers.

## Step 5: Split Strict and Loose Protobuf/Connect Message Types

### Problem

`MessageResponse<T extends MessageKey = MessageKey>` and similar types distribute over all message keys when used without a narrow generic. This is accurate but expensive when broad plumbing does not need exact correlation.

### Action

Keep strict correlated types for typed calls:

```ts
export type TypedMessageResponse<T extends MessageKey> = {
    type: T;
    message: MessagePayload<T>;
};
```

Add loose types for generic transport/event plumbing:

```ts
export type AnyMessageResponse = {
    type: MessageKey;
    message: unknown;
};
```

Update broad transport boundaries to use loose types where they only forward or log messages and do not inspect message-specific payload fields.

### Verification

Functional checks:

```bash
yarn nx run @trezor/protobuf:type-check
yarn nx run @trezor/connect-common:type-check
yarn nx run @trezor/transport-common:type-check
yarn nx run @trezor/connect:type-check
```

Performance checks:

```bash
yarn run -T tsc --build packages/protobuf/tsconfig.json --extendedDiagnostics --force
yarn run -T tsc --build packages/connect-common/tsconfig.json --extendedDiagnostics --force
yarn run -T tsc --build packages/transport-common/tsconfig.json --extendedDiagnostics --force
```

Expected improvement:

- Broad transport packages show fewer instantiations.
- Strict typed-call APIs still infer exact response payloads.

Failure signal:

- Call sites that inspect message payloads lose type narrowing.
- Typed call tests need new casts.

## Step 6: Reduce Analytics Event Union Expansion

### Problem

Analytics event definitions are converted into broad `EventInstance<AnyEventsDef>` unions. This is useful for validation but can be expensive when imported widely.

### Action

Separate authoring-time event definition validation from runtime reporting types:

- Keep strict `EventDef` validation near event declarations.
- Export a lighter reporting type for common analytics clients:

```ts
export type AnalyticsEvent = {
    type: string;
    payload?: Record<string, unknown>;
};
```

Use strict event unions only in tests, docs generation, and event-definition modules.

### Verification

Functional checks:

```bash
yarn nx run @suite-common/analytics:type-check
yarn nx run @suite/analytics:type-check
yarn nx run @suite-native/analytics:type-check
```

Performance checks:

```bash
yarn run -T tsc --build suite-common/analytics/tsconfig.json --extendedDiagnostics --force
yarn run -T tsc --build suite/analytics/tsconfig.json --extendedDiagnostics --force
yarn run -T tsc --build suite-native/analytics/tsconfig.json --extendedDiagnostics --force
```

Expected improvement:

- Fewer event-union instantiations in analytics consumers.
- Event definition files still validate payload and attribute shapes.

Failure signal:

- Analytics reporting accepts invalid event names in places where strict validation is still required.

## Step 7: Add a Repeatable Type Performance Check

### Problem

Type performance regressions are hard to catch because regular type checks only report pass/fail.

### Action

Add a script that runs selected `tsc --extendedDiagnostics` commands and writes a small summary table:

- package
- check time
- types
- instantiations
- memory
- declaration size

Keep this script local or CI-optional at first. It should not fail CI until thresholds are agreed.

### Verification

Script check:

```bash
yarn type-perf
```

Expected output shape:

```text
package                             check   types    instantiations   memory   dts
suite/intl                          0.62s   11717    37858            230MB    555KB
suite-native/intl                   ...
suite-common/earn-stablecoin-defs   ...
```

Expected improvement:

- Developers can compare before/after numbers without manually parsing long TypeScript logs.

Failure signal:

- Script is too slow for local use.
- Script produces unstable numbers that cannot guide decisions.

## Suggested Order

1. Generate flat translation key types.
2. Stop exporting full translation message shapes from package-level APIs.
3. Hide generated Zod schema internals.
4. Simplify public router types.
5. Split strict and loose protobuf/connect message types.
6. Reduce analytics event union expansion.
7. Add repeatable type performance reporting.

Translations should go first because they have high fan-out, low runtime risk, and obvious public type leakage. Generated Zod types should go second or third because the declaration size is large and isolated, but generator maintainability must be handled carefully.

