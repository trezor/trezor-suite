import { getEthereumValidatorsQueue, getStakingStats } from '@suite-common/earn-staking-api';
import type { StakingProductAdapter } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createEverstakePooledProduct } from './products/ethereum/createEverstakePooledProduct';

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

export const createStakingProductsCompositionRoot = (): readonly StakingProductAdapter[] => [
    ...createEthereumStakingProducts(),
];
