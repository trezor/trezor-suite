import { getEthereumValidatorsQueue, getStakingStats } from '@suite-common/earn-staking-api';
import type { StakingProductAdapter } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createEverstakePooledProduct } from './ethereum/createEverstakePooledProduct';
import { createSolanaProducts } from './solana/createSolanaProducts';

const ETHEREUM_STAKING_PRODUCTS: readonly StakingProductAdapter[] = [
    createEverstakePooledProduct({
        networkSymbol: asNetworkSymbol('eth'),
        getStakingStats,
        getEthereumValidatorsQueue,
    }),
    createEverstakePooledProduct({
        networkSymbol: asNetworkSymbol('thod'),
        getStakingStats,
        getEthereumValidatorsQueue,
    }),
];

const SOLANA_STAKING_PRODUCTS: readonly StakingProductAdapter[] = [
    ...createSolanaProducts({
        networkSymbol: asNetworkSymbol('sol'),
        getStakingStats,
    }),
    ...createSolanaProducts({
        networkSymbol: asNetworkSymbol('dsol'),
        getStakingStats,
    }),
];

export const createStakingProductsCompositionRoot = (): readonly StakingProductAdapter[] => [
    ...ETHEREUM_STAKING_PRODUCTS,
    ...SOLANA_STAKING_PRODUCTS,
];
