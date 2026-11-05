import {
    getCardanoPools,
    getEthereumValidatorsQueue,
    getStakingStats,
} from '@suite-common/earn-staking-api';
import type { StakingProductAdapter } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    CARDANO_STAKE_KEY_MESSAGE_SYSTEM_FEATURES,
    EVERSTAKE_CARDANO_MESSAGE_SYSTEM_FEATURES,
} from './products/cardano/cardanoMessageSystemFeatures';
import { createCardanoExternalDelegationProduct } from './products/cardano/external/createCardanoExternalDelegationProduct';
import { createCardanoNativeDelegationProduct } from './products/cardano/native/createCardanoNativeDelegationProduct';
import { createCardanoRetiredDelegationProduct } from './products/cardano/retired/createCardanoRetiredDelegationProduct';
import { createEverstakePooledProduct } from './products/ethereum/createEverstakePooledProduct';
import { createSolanaExternalDelegationProduct } from './products/solana/external/createSolanaExternalDelegationProduct';
import { createSolanaNativeDelegationProduct } from './products/solana/native/createSolanaNativeDelegationProduct';
import { EVERSTAKE_SOLANA_MESSAGE_SYSTEM_FEATURES } from './products/solana/native/solanaNativeDelegationProductDescriptor';
import { everstakeProvider } from './providers/everstake';
import { fivebinariesProvider } from './providers/fivebinaries';

const createEthereumStakingProducts = (): readonly StakingProductAdapter[] => {
    const ethereumStakingApi = { getStakingStats, getEthereumValidatorsQueue };

    return [
        createEverstakePooledProduct({
            networkSymbol: asNetworkSymbol('eth'),
            ...ethereumStakingApi,
        }),
        createEverstakePooledProduct({
            networkSymbol: asNetworkSymbol('thod'),
            ...ethereumStakingApi,
        }),
    ];
};

const createSolanaStakingProducts = (): readonly StakingProductAdapter[] => {
    const solanaStakingApi = { getStakingStats };

    return [
        createSolanaNativeDelegationProduct({
            networkSymbol: asNetworkSymbol('sol'),
            provider: everstakeProvider,
            messageSystemFeatures: EVERSTAKE_SOLANA_MESSAGE_SYSTEM_FEATURES,
            ...solanaStakingApi,
        }),
        createSolanaExternalDelegationProduct({
            networkSymbol: asNetworkSymbol('sol'),
            managedProviders: [everstakeProvider],
        }),
        createSolanaNativeDelegationProduct({
            networkSymbol: asNetworkSymbol('dsol'),
            provider: everstakeProvider,
            messageSystemFeatures: {},
            ...solanaStakingApi,
        }),
        createSolanaExternalDelegationProduct({
            networkSymbol: asNetworkSymbol('dsol'),
            managedProviders: [everstakeProvider],
        }),
    ];
};

const createCardanoStakingProducts = (): readonly StakingProductAdapter[] => {
    const cardanoStakingApi = { getCardanoPools };

    return [
        createCardanoNativeDelegationProduct({
            networkSymbol: asNetworkSymbol('ada'),
            provider: everstakeProvider,
            messageSystemFeatures: EVERSTAKE_CARDANO_MESSAGE_SYSTEM_FEATURES,
            ...cardanoStakingApi,
        }),
        createCardanoRetiredDelegationProduct({
            networkSymbol: asNetworkSymbol('ada'),
            provider: fivebinariesProvider,
            messageSystemFeatures: CARDANO_STAKE_KEY_MESSAGE_SYSTEM_FEATURES,
        }),
        createCardanoExternalDelegationProduct({
            networkSymbol: asNetworkSymbol('ada'),
            managedProviders: [everstakeProvider, fivebinariesProvider],
            messageSystemFeatures: CARDANO_STAKE_KEY_MESSAGE_SYSTEM_FEATURES,
        }),
    ];
};

export const createStakingProductsCompositionRoot = (): readonly StakingProductAdapter[] => [
    ...createEthereumStakingProducts(),
    ...createSolanaStakingProducts(),
    ...createCardanoStakingProducts(),
];
