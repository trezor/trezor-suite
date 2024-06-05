import { createAction } from '@reduxjs/toolkit';

import { NetworkSymbol } from '@suite-common/wallet-config';
import type { CustomBackend, NetworksFees } from '@suite-common/wallet-types';
import type { Timeout } from '@trezor/type-utils';

export const BLOCKCHAIN_MODULE_PREFIX = '@common/wallet-core/blockchain';

const connected = createAction(
    `${BLOCKCHAIN_MODULE_PREFIX}/connected`,
    (payload: NetworkSymbol) => ({
        payload,
    }),
);

const updateFee = createAction(
    `${BLOCKCHAIN_MODULE_PREFIX}/updateFee`,
    (payload: Partial<NetworksFees>) => ({
        payload,
    }),
);

const synced = createAction(
    `${BLOCKCHAIN_MODULE_PREFIX}/synced`,
    (payload: { symbol: NetworkSymbol; timeout?: Timeout }) => ({
        payload,
    }),
);

export type SetBackendPayload =
    | CustomBackend
    | { coin: NetworkSymbol; type: 'default'; urls?: unknown };
const setBackend = createAction(
    `${BLOCKCHAIN_MODULE_PREFIX}/setBackend`,
    (payload: SetBackendPayload) => ({
        payload,
    }),
);

export const blockchainActions = {
    setBackend,
    connected,
    updateFee,
    synced,
};
