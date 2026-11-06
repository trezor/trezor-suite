import { getCardanoPools } from '@suite-common/earn-staking-api';
import type { StakingProductAdapter } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    CARDANO_STAKE_KEY_MESSAGE_SYSTEM_FEATURES,
    EVERSTAKE_CARDANO_MESSAGE_SYSTEM_FEATURES,
} from './cardanoMessageSystemFeatures';
import { createCardanoExternalDelegationProduct } from './external/createCardanoExternalDelegationProduct';
import { createCardanoNativeDelegationProduct } from './native/createCardanoNativeDelegationProduct';
import { createCardanoRetiredDelegationProduct } from './retired/createCardanoRetiredDelegationProduct';
import { everstakeProvider } from '../../providers/everstake';
import { fivebinariesProvider } from '../../providers/fivebinaries';

export const createCardanoStakingProducts = (): readonly StakingProductAdapter[] => {
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
