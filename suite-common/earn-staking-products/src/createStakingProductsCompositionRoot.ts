import {
    getCardanoPools,
    getEthereumValidatorsQueue,
    getStakingStats,
    getTronStakingStats,
} from '@suite-common/earn-staking-api';
import type { StakingProductAdapter } from '@suite-common/earn-staking-common';
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
import { TRON_CURATED_PRODUCT_MESSAGE_SYSTEM_FEATURES } from './products/tron/curated/messageSystemFeatures';
import { createTronCuratedProduct } from './products/tron/curated/product';
import { everstakeProvider } from './providers/everstake';
import { fivebinariesProvider } from './providers/fivebinaries';
import { luganodesProvider } from './providers/luganodes';
import { p2pProvider } from './providers/p2p';
import { getStakingProvider } from './providers/stakingProviders';

const createEthereumStakingProducts = (): readonly StakingProductAdapter[] => {
    const ethereumStakingApi = { getStakingStats, getEthereumValidatorsQueue };

    return [
        createEthereumEverstakePooledProduct({
            networkSymbol: asNetworkSymbol('eth'),
            ...ethereumStakingApi,
        }),
        createEthereumEverstakePooledProduct({
            networkSymbol: asNetworkSymbol('thod'),
            ...ethereumStakingApi,
        }),
    ];
};

const createSolanaStakingProducts = (): readonly StakingProductAdapter[] => {
    const solanaStakingApi = { getStakingStats };

    return [
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
};

const createCardanoStakingProducts = (): readonly StakingProductAdapter[] => {
    const cardanoStakingApi = { getCardanoPools };

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

    // A stake key delegates to one pool, so the external product
    // owns exactly the pools the products above do not.
    return [
        ...managedProducts,
        createCardanoExternalNativeProduct({
            networkSymbol: asNetworkSymbol('ada'),
            managedProviders: managedProducts.map(({ descriptor }) =>
                getStakingProvider(descriptor.providerId),
            ),
            messageSystemFeatures: CARDANO_STAKING_MESSAGE_SYSTEM_FEATURES,
        }),
    ];
};

const createTronStakingProducts = (): readonly StakingProductAdapter[] => {
    const tronStakingApi = { getTronStakingStats };

    return [
        createTronCuratedProduct({
            networkSymbol: asNetworkSymbol('trx'),
            providers: [luganodesProvider, p2pProvider],
            messageSystemFeatures: TRON_CURATED_PRODUCT_MESSAGE_SYSTEM_FEATURES,
            ...tronStakingApi,
        }),
    ];
};

export const createStakingProductsCompositionRoot = (): readonly StakingProductAdapter[] => [
    ...createEthereumStakingProducts(),
    ...createSolanaStakingProducts(),
    ...createCardanoStakingProducts(),
    ...createTronStakingProducts(),
];
