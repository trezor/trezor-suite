import { getStakingStats } from '@suite-common/earn-staking-api';
import type { StakingProductAdapter } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createSolanaExternalDelegationProduct } from './external/createSolanaExternalDelegationProduct';
import { createSolanaNativeDelegationProduct } from './native/createSolanaNativeDelegationProduct';
import { EVERSTAKE_SOLANA_MESSAGE_SYSTEM_FEATURES } from './native/solanaNativeDelegationProductDescriptor';
import { everstakeProvider } from '../../providers/everstake';

export const createSolanaStakingProducts = (): readonly StakingProductAdapter[] => {
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
