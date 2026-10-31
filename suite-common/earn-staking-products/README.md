# @suite-common/earn-staking-products

The staking products: providers, network kits, the per-network product factories and `createStakingProductsCompositionRoot`, which builds the adapters the product repository registers. Products implement the contracts from `@suite-common/earn-staking-common` and receive everything an app owns, such as Connect and staking API data, as injected dependencies.

Only the two application composition roots, in `@trezor/suite` and `@suite-native/state`, depend on this package. Everything else reaches products through the injected product repository from `@suite-common/earn-staking`. `forbiddenDeps.config.ts` enforces both directions, and `@trezor/eslint` keeps the import out of every file but the composition roots themselves.
