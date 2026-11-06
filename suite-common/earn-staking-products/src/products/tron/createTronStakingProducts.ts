import { getTronStakingStats } from '@suite-common/earn-staking-api';
import type { StakingProductAdapter } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createTronCuratedProduct } from './createTronCuratedProduct';
import { TRON_CURATED_MESSAGE_SYSTEM_FEATURES } from './tronCuratedProductDescriptor';
import { luganodesProvider } from '../../providers/luganodes';
import { p2pProvider } from '../../providers/p2p';

export const createTronStakingProducts = (): readonly StakingProductAdapter[] => {
    const tronStakingApi = { getTronStakingStats };

    return [
        createTronCuratedProduct({
            networkSymbol: asNetworkSymbol('trx'),
            providers: [luganodesProvider, p2pProvider],
            messageSystemFeatures: TRON_CURATED_MESSAGE_SYSTEM_FEATURES,
            ...tronStakingApi,
        }),
    ];
};
