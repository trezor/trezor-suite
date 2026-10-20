import { createAction } from '@reduxjs/toolkit';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import type { CustomEvmNetworkDefinition } from '@suite-common/wallet-types';

export const CUSTOM_EVM_NETWORKS_MODULE_PREFIX = '@common/wallet-core/custom-evm-networks';

// One action for every slice keyed by network, so a network appears or disappears everywhere at once.
const registered = createAction(
    `${CUSTOM_EVM_NETWORKS_MODULE_PREFIX}/registered`,
    (payload: { definition: CustomEvmNetworkDefinition }) => ({ payload }),
);

const unregistered = createAction(
    `${CUSTOM_EVM_NETWORKS_MODULE_PREFIX}/unregistered`,
    (payload: { symbol: NetworkSymbol }) => ({ payload }),
);

export const customEvmNetworksActions = {
    registered,
    unregistered,
};
