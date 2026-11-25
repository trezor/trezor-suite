import {
    getCardanoPools,
    getEthereumValidatorsQueueQueryOptions,
    getStakingStatsQueryOptions,
    getTronStakingStats,
} from '@suite-common/earn-staking-api';
import type { StakingProductAdapter } from '@suite-common/earn-staking-common';
import { type QueryClientDep, SILENT_QUERY_META } from '@suite-common/react-query';
import { asNetworkSymbol } from '@trezor/network-module-types';
import { promiseRaceWithSignal } from '@trezor/utils';

import { createCardanoEverstakeNativeProduct } from './products/cardano/everstake-native/product';
import { createCardanoExternalNativeProduct } from './products/cardano/external-native/product';
import { createCardanoFivebinariesNativeProduct } from './products/cardano/fivebinaries-native/product';
import {
    CARDANO_EVERSTAKE_NATIVE_MESSAGE_SYSTEM_FEATURES,
    CARDANO_STAKING_MESSAGE_SYSTEM_FEATURES,
} from './products/cardano/messageSystemFeatures';
import {
    type EthereumEverstakePooledProductDeps,
    createEthereumEverstakePooledProduct,
} from './products/ethereum/everstake-pooled/product';
import { SOLANA_EVERSTAKE_NATIVE_PRODUCT_MESSAGE_SYSTEM_FEATURES } from './products/solana/everstake-native/messageSystemFeatures';
import {
    type SolanaEverstakeNativeProductDeps,
    createSolanaEverstakeNativeProduct,
} from './products/solana/everstake-native/product';
import { createSolanaExternalNativeProduct } from './products/solana/external-native/product';
import { TRON_NATIVE_PRODUCT_MESSAGE_SYSTEM_FEATURES } from './products/tron/native/messageSystemFeatures';
import { createTronNativeProduct } from './products/tron/native/product';
import { everstakeProvider } from './providers/everstake';
import { fivebinariesProvider } from './providers/fivebinaries';
import { luganodesProvider } from './providers/luganodes';
import { p2pProvider } from './providers/p2p';
import { getStakingProvider } from './providers/stakingProviders';

type SharedStakingApi = EthereumEverstakePooledProductDeps & SolanaEverstakeNativeProductDeps;

/**
 * The product info query around these requests decides when its info is stale,
 * retries, fetches offline and reports failures,
 * so a request is shared only while it is in flight and does none of that on its own.
 */
const SHARED_REQUEST_QUERY_OPTIONS = {
    staleTime: 0,
    retry: false,
    networkMode: 'always',
    meta: SILENT_QUERY_META,
} as const;

/**
 * A mainnet product and its testnet product, Hoodi or devnet, read the same mainnet endpoints,
 * so they fetch them through the app's query client, which sends one request for both.
 */
const createSharedStakingApi = ({ queryClient }: QueryClientDep): SharedStakingApi => ({
    getStakingStats: ({ routeParams, signal }) =>
        promiseRaceWithSignal(
            queryClient.query({
                ...getStakingStatsQueryOptions(routeParams.networkSymbol),
                ...SHARED_REQUEST_QUERY_OPTIONS,
            }),
            signal,
        ),
    getEthereumValidatorsQueue: ({ params, signal } = {}) =>
        promiseRaceWithSignal(
            queryClient.query({
                ...getEthereumValidatorsQueueQueryOptions(params),
                ...SHARED_REQUEST_QUERY_OPTIONS,
            }),
            signal,
        ),
});

const createEthereumStakingProducts = ({
    getStakingStats,
    getEthereumValidatorsQueue,
}: SharedStakingApi): readonly StakingProductAdapter[] => [
    createEthereumEverstakePooledProduct({
        networkSymbol: asNetworkSymbol('eth'),
        getStakingStats,
        getEthereumValidatorsQueue,
    }),
    createEthereumEverstakePooledProduct({
        networkSymbol: asNetworkSymbol('thod'),
        getStakingStats,
        getEthereumValidatorsQueue,
    }),
];

const createSolanaStakingProducts = ({
    getStakingStats,
}: SharedStakingApi): readonly StakingProductAdapter[] => [
    createSolanaEverstakeNativeProduct({
        networkSymbol: asNetworkSymbol('sol'),
        provider: everstakeProvider,
        messageSystemFeatures: SOLANA_EVERSTAKE_NATIVE_PRODUCT_MESSAGE_SYSTEM_FEATURES,
        getStakingStats,
    }),
    createSolanaExternalNativeProduct({
        networkSymbol: asNetworkSymbol('sol'),
        managedProviders: [everstakeProvider],
    }),
    createSolanaEverstakeNativeProduct({
        networkSymbol: asNetworkSymbol('dsol'),
        provider: everstakeProvider,
        messageSystemFeatures: {},
        getStakingStats,
    }),
    createSolanaExternalNativeProduct({
        networkSymbol: asNetworkSymbol('dsol'),
        managedProviders: [everstakeProvider],
    }),
];

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

const createTronStakingProducts = (): readonly StakingProductAdapter[] => {
    const tronStakingApi = { getTronStakingStats };

    return [
        createTronNativeProduct({
            networkSymbol: asNetworkSymbol('trx'),
            providers: [luganodesProvider, p2pProvider],
            messageSystemFeatures: TRON_NATIVE_PRODUCT_MESSAGE_SYSTEM_FEATURES,
            ...tronStakingApi,
        }),
    ];
};

export type StakingProductsCompositionRootDeps = QueryClientDep;

export const createStakingProductsCompositionRoot = (
    deps: StakingProductsCompositionRootDeps,
): readonly StakingProductAdapter[] => {
    const sharedStakingApi = createSharedStakingApi(deps);

    return [
        ...createEthereumStakingProducts(sharedStakingApi),
        ...createSolanaStakingProducts(sharedStakingApi),
        ...createCardanoStakingProducts(),
        ...createTronStakingProducts(),
    ];
};
