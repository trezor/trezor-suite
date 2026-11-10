export { createStakingProductsCompositionRoot } from './createStakingProductsCompositionRoot';
export {
    createCardanoEverstakeNativeProduct,
    type CardanoEverstakeNativeProductDeps,
    type CreateCardanoEverstakeNativeProductParams,
} from './products/cardano/everstake-native/product';
export {
    createCardanoExternalProduct,
    type CreateCardanoExternalProductParams,
} from './products/cardano/external/product';
export {
    createCardanoFivebinariesRetiredProduct,
    type CreateCardanoFivebinariesRetiredProductParams,
} from './products/cardano/fivebinaries-retired/product';
export {
    createEthereumEverstakePooledProduct,
    type CreateEthereumEverstakePooledProductParams,
    type EthereumEverstakePooledProductDeps,
} from './products/ethereum/everstake-pooled/product';
export {
    createSolanaEverstakeNativeProduct,
    type CreateSolanaEverstakeNativeProductParams,
    type SolanaEverstakeNativeProductDeps,
} from './products/solana/everstake-native/product';
export {
    createSolanaExternalProduct,
    type CreateSolanaExternalProductParams,
} from './products/solana/external/product';
export {
    createTronCuratedProduct,
    type CreateTronCuratedProductParams,
    type TronCuratedProductDeps,
} from './products/tron/curated/product';
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
