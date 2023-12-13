import { createAction } from '@reduxjs/toolkit';

import { NetworkSymbol } from '@suite-common/wallet-config';
import type { CustomBackend, NetworksFees } from '@suite-common/wallet-types';
import type { Timeout } from '@trezor/type-utils';

export const actionsPrefix = '@common/blockchain';

const connected = createAction(`${actionsPrefix}/connected`, (payload: NetworkSymbol) => ({
    payload,
}));

type ReconnectTimeoutStartPayload = {
    symbol: NetworkSymbol;
    id: Timeout;
    time: number;
    count: number;
};
const reconnectTimeoutStart = createAction(
    `${actionsPrefix}/reconnectTimeoutStart`,
    (payload: ReconnectTimeoutStartPayload) => ({
        payload,
    }),
);

const updateFee = createAction(`${actionsPrefix}/updateFee`, (payload: Partial<NetworksFees>) => ({
    payload,
}));

const synced = createAction(
    `${actionsPrefix}/synced`,
    (payload: { symbol: NetworkSymbol; timeout?: Timeout }) => ({
        payload,
    }),
);

export type SetBackendPayload =
    | CustomBackend
    | { coin: NetworkSymbol; type: 'default'; urls?: unknown };
const setBackend = createAction(`${actionsPrefix}/setBackend`, (payload: SetBackendPayload) => ({
    payload,
}));

export const blockchainActions = {
    setBackend,
    connected,
    reconnectTimeoutStart,
    updateFee,
    synced,
};
