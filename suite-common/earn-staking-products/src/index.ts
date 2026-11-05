export { createStakingProductsCompositionRoot } from './createStakingProductsCompositionRoot';
export {
    createEverstakePooledProduct,
    type CreateEverstakePooledProductParams,
    type EverstakePooledProductDeps,
} from './products/ethereum/createEverstakePooledProduct';
export {
    createSolanaExternalDelegationProduct,
    type CreateSolanaExternalDelegationProductParams,
} from './products/solana/external/createSolanaExternalDelegationProduct';
export {
    createSolanaNativeDelegationProduct,
    type CreateSolanaNativeDelegationProductParams,
    type SolanaNativeDelegationProductDeps,
} from './products/solana/native/createSolanaNativeDelegationProduct';
export { curatedProvider } from './providers/curated';
export { everstakeProvider } from './providers/everstake';
export { externalProvider } from './providers/external';
export { fivebinariesProvider } from './providers/fivebinaries';
export { luganodesProvider } from './providers/luganodes';
export { p2pProvider } from './providers/p2p';
export {
    findStakingProviderByIdentity,
    getStakingProvider,
    stakingProviders,
} from './providers/stakingProviders';
