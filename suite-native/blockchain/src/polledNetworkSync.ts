import { type Dispatch } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type FetchAndUpdateAccountThunkState } from '@suite-common/wallet-core';

import { selectShouldPollNetwork } from './blockchainSelectors';
import { syncAccountsWithBlockchainThunk } from './blockchainThunks';

export const POLLED_NETWORK_SYNC_INTERVAL_MS = 60_000;

const polledNetworkSyncTimeouts: Partial<Record<NetworkSymbol, ReturnType<typeof setTimeout>>> = {};

type SchedulePolledNetworkSyncParams = {
    symbol: NetworkSymbol;
    dispatch: Dispatch;
    getState: () => FetchAndUpdateAccountThunkState;
    // A finished sync replaces its own timer; other triggers must not postpone a scheduled one.
    shouldReplaceScheduled: boolean;
};

export const schedulePolledNetworkSync = ({
    symbol,
    dispatch,
    getState,
    shouldReplaceScheduled,
}: SchedulePolledNetworkSyncParams) => {
    if (!shouldReplaceScheduled && polledNetworkSyncTimeouts[symbol] !== undefined) return;

    clearTimeout(polledNetworkSyncTimeouts[symbol]);
    delete polledNetworkSyncTimeouts[symbol];

    if (!selectShouldPollNetwork(getState(), symbol)) return;

    polledNetworkSyncTimeouts[symbol] = setTimeout(() => {
        delete polledNetworkSyncTimeouts[symbol];
        dispatch(syncAccountsWithBlockchainThunk({ symbol }));
    }, POLLED_NETWORK_SYNC_INTERVAL_MS);
};
