# @suite-common/earn-staking

Staking logic shared by the desktop, web and mobile apps: the product repository and, later, the staking state, engine and view-model hooks. Apps and shared packages import this package and `@suite-common/earn-staking-common`, which holds the contracts.

The products live in `@suite-common/earn-staking-products`, which this package must not import; `forbiddenDeps.config.ts` enforces it. The application composition roots register the products and expose them to this package as the injected product repository, under `services.staking`.

Product info is server data, so it lives in the app's shared query client under `commonQueryKeys.stakingProductInfo`, fetched through the product adapters by `refreshStakingProductInfoThunk`; the redux state holds the platform, the descriptors and the positions only.

`@suite-common/earn-staking/mocks` holds test factories.
