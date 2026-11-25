import {
    type CardanoStakingApi,
    type EthereumStakingApi,
    type SolanaStakingApi,
    type TronStakingApi,
    createCardanoStakingApi,
    createEthereumStakingApi,
    createSolanaStakingApi,
    createTronStakingApi,
} from '@suite-common/earn-staking-api';
import type { StakingProductAdapter } from '@suite-common/earn-staking-common';
import type { QueryClientDep } from '@suite-common/react-query';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createCardanoEverstakeNativeProduct } from './products/cardano/everstake-native/product';
import { createCardanoExternalNativeProduct } from './products/cardano/external-native/product';
import { createCardanoFivebinariesNativeProduct } from './products/cardano/fivebinaries-native/product';
import {
    CARDANO_EVERSTAKE_NATIVE_MESSAGE_SYSTEM_FEATURES,
    CARDANO_STAKING_MESSAGE_SYSTEM_FEATURES,
} from './products/cardano/messageSystemFeatures';
import { createEthereumEverstakePooledProduct } from './products/ethereum/everstake-pooled/product';
import { SOLANA_EVERSTAKE_NATIVE_PRODUCT_MESSAGE_SYSTEM_FEATURES } from './products/solana/everstake-native/messageSystemFeatures';
import { createSolanaEverstakeNativeProduct } from './products/solana/everstake-native/product';
import { createSolanaExternalNativeProduct } from './products/solana/external-native/product';
import { TRON_NATIVE_PRODUCT_MESSAGE_SYSTEM_FEATURES } from './products/tron/native/messageSystemFeatures';
import { createTronNativeProduct } from './products/tron/native/product';
import { everstakeProvider } from './providers/everstake';
import { fivebinariesProvider } from './providers/fivebinaries';
import { luganodesProvider } from './providers/luganodes';
import { p2pProvider } from './providers/p2p';
import { getStakingProvider } from './providers/stakingProviders';

const createEthereumStakingProducts = (
    ethereumStakingApi: EthereumStakingApi,
): readonly StakingProductAdapter[] => [
    createEthereumEverstakePooledProduct({
        networkSymbol: asNetworkSymbol('eth'),
        ...ethereumStakingApi,
    }),
    createEthereumEverstakePooledProduct({
        networkSymbol: asNetworkSymbol('thod'),
        ...ethereumStakingApi,
    }),
];

const createSolanaStakingProducts = (
    solanaStakingApi: SolanaStakingApi,
): readonly StakingProductAdapter[] => [
    createSolanaEverstakeNativeProduct({
        networkSymbol: asNetworkSymbol('sol'),
        provider: everstakeProvider,
        messageSystemFeatures: SOLANA_EVERSTAKE_NATIVE_PRODUCT_MESSAGE_SYSTEM_FEATURES,
        ...solanaStakingApi,
    }),
    createSolanaExternalNativeProduct({
        networkSymbol: asNetworkSymbol('sol'),
        managedProviders: [everstakeProvider],
    }),
    createSolanaEverstakeNativeProduct({
        networkSymbol: asNetworkSymbol('dsol'),
        provider: everstakeProvider,
        messageSystemFeatures: {},
        ...solanaStakingApi,
    }),
    createSolanaExternalNativeProduct({
        networkSymbol: asNetworkSymbol('dsol'),
        managedProviders: [everstakeProvider],
    }),
];

const createCardanoStakingProducts = (
    cardanoStakingApi: CardanoStakingApi,
): readonly StakingProductAdapter[] => {
    const managedProducts = [
        createCardanoEverstakeNativeProduct({
            networkSymbol: asNetworkSymbol('ada'),
            provider: everstakeProvider,
            messageSystemFeatures: CARDANO_EVERSTAKE_NATIVE_MESSAGE_SYSTEM_FEATURES,
            ...cardanoStakingApi,
        }),
        createCardanoFivebinariesNativeProduct({
            networkSymbol: asNetworkSymbol('ada'),
            provider: fivebinariesProvider,
            messageSystemFeatures: CARDANO_STAKING_MESSAGE_SYSTEM_FEATURES,
        }),
    ];

    const managedProviders = managedProducts.map(({ descriptor }) =>
        getStakingProvider(descriptor.providerId),
    );

    // A stake key delegates to one pool, so the external product
    // owns exactly the pools the products above do not.
    const externalProduct = createCardanoExternalNativeProduct({
        networkSymbol: asNetworkSymbol('ada'),
        managedProviders,
        messageSystemFeatures: CARDANO_STAKING_MESSAGE_SYSTEM_FEATURES,
    });

    return [...managedProducts, externalProduct];
};

const createTronStakingProducts = (
    tronStakingApi: TronStakingApi,
): readonly StakingProductAdapter[] => [
    createTronNativeProduct({
        networkSymbol: asNetworkSymbol('trx'),
        providers: [luganodesProvider, p2pProvider],
        messageSystemFeatures: TRON_NATIVE_PRODUCT_MESSAGE_SYSTEM_FEATURES,
        ...tronStakingApi,
    }),
];

export type StakingProductsCompositionRootDeps = QueryClientDep;

export const createStakingProductsCompositionRoot = (
    deps: StakingProductsCompositionRootDeps,
): readonly StakingProductAdapter[] => [
    ...createEthereumStakingProducts(createEthereumStakingApi(deps)),
    ...createSolanaStakingProducts(createSolanaStakingApi(deps)),
    ...createCardanoStakingProducts(createCardanoStakingApi(deps)),
    ...createTronStakingProducts(createTronStakingApi(deps)),
];
