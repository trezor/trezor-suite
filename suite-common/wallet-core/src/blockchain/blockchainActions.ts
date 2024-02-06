import { createAction } from '@reduxjs/toolkit';

import { NetworkSymbol } from '@suite-common/wallet-config';
import type { CustomBackend, NetworksFees } from '@suite-common/wallet-types';
import type { Timeout } from '@trezor/type-utils';

export const blockchainActionsPrefix = '@common/wallet-core/blockchain';

const connected = createAction(
    `${blockchainActionsPrefix}/connected`,
    (payload: NetworkSymbol) => ({
        payload,
    }),
);

const updateFee = createAction(
    `${blockchainActionsPrefix}/updateFee`,
    (payload: Partial<NetworksFees>) => ({
        payload,
    }),
);

const synced = createAction(
    `${blockchainActionsPrefix}/synced`,
    (payload: { symbol: NetworkSymbol; timeout?: Timeout }) => ({
        payload,
    }),
);

export type SetBackendPayload =
    | CustomBackend
    | { coin: NetworkSymbol; type: 'default'; urls?: unknown };
const setBackend = createAction(
    `${blockchainActionsPrefix}/setBackend`,
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
