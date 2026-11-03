# @suite-common/earn-staking

Staking logic shared by the desktop, web and mobile apps: the product repository and, later, the staking state, engine and view-model hooks. Apps and shared packages import this package and `@suite-common/earn-staking-common`, which holds the contracts.

The products live in `@suite-common/earn-staking-products`, which this package must not import; `forbiddenDeps.config.ts` enforces it. The application composition roots register the products and expose them to this package as the injected product repository, under `services.staking`.

Both apps register the state as `state.earn.staking`, under the `earn` key that yield and lending will join later. Shared code never names the root: selectors and thunks are typed on `StakingRootState`.

Product info is server data, so it lives in the app's shared query client under `commonQueryKeys.stakingProductInfo`, fetched through the product adapters by `refreshStakingProductInfoThunk`; the redux state holds the platform, the descriptors and the positions only.

Staking operations run as sessions, one per account, product and operation, keyed by `getStakingSessionKey`. A session holds the plan and one status-tagged entry per step: `pending`, `composed`, `signing`, `signed`, `broadcasting`, `awaiting`, `done` or `failed`. A recoverable error keeps the step where the next thunk can retry it and sits on the step as a kind and code; `failed` is an on-chain outcome. The review modal and screens read the step that is signing, signed or broadcasting through `selectStakingReview`, which is derived from the sessions, so nothing can go stale. Sessions are not persisted.

The engine thunks in `src/engine` drive a session step by step through the product adapter: plan, compose, sign, broadcast, cancel a step and discard a session. Signing runs inside the injected `StakingDeviceAccess`, `services.staking.deviceAccess`: a pass-through on desktop and web, where Connect already serialises device calls, and the prioritised device mutex on mobile. It is also the one place that cancels a device call. An adapter reports a device or app cancellation and the validity timeout as `StakingAdapterError` codes from `STAKING_SIGNING_ERROR_CODES`; everything else keeps its own code.

`toPrecomposedLevels` turns a composed step into the precomposed levels the existing fee pickers accept.

`@suite-common/earn-staking/mocks` holds test factories.
