import { createWeakMapSelector } from '@suite-common/redux-utils';
import { type NetworkSymbol, type NetworkType, getNetworkType } from '@suite-common/wallet-config';
import {
    type FetchAndUpdateAccountThunkState,
    selectDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';

const createMemoizedSelector = createWeakMapSelector.withTypes<FetchAndUpdateAccountThunkState>();

// Blockfrost pushes neither block nor address notifications to mobile clients, so without polling
// incoming and confirmed transactions would only show up after an app restart. Other backends
// push these reliably and are not polled.
const POLLED_NETWORK_TYPES: NetworkType[] = ['cardano'];

// Scoped to the selected device, because the sync refreshes only its accounts.
export const selectShouldPollNetwork = createMemoizedSelector(
    [selectDeviceAccountsByNetworkSymbol, (_state, symbol: NetworkSymbol) => symbol],
    (deviceAccounts, symbol) =>
        POLLED_NETWORK_TYPES.includes(getNetworkType(symbol)) && deviceAccounts.length > 0,
);
