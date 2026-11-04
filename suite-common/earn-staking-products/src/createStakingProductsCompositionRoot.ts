import { getEthereumValidatorsQueue, getStakingStats } from '@suite-common/earn-staking-api';
import type { StakingProductAdapter } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createEverstakePooledProduct } from './ethereum/createEverstakePooledProduct';

export const createStakingProductsCompositionRoot = (): readonly StakingProductAdapter[] => [
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
