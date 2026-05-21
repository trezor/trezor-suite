import { createAction } from '@reduxjs/toolkit';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import type { CustomBackend } from '@suite-common/wallet-types';
import type { TimerId } from '@trezor/type-utils';

export const BLOCKCHAIN_MODULE_PREFIX = '@common/wallet-core/blockchain';

const connected = createAction(
    `${BLOCKCHAIN_MODULE_PREFIX}/connected`,
    (payload: NetworkSymbol) => ({
        payload,
    }),
);

const synced = createAction(
    `${BLOCKCHAIN_MODULE_PREFIX}/synced`,
    // `time` is the wall-clock timestamp of the completed sync (Date.now()), used by
    // onBlockMinedThunk to throttle block-mined-triggered fan-out. Optional for back-compat.
    (payload: { symbol: NetworkSymbol; timeout?: TimerId; time?: number }) => ({
        payload,
    }),
);

export type SetBackendPayload =
    | CustomBackend
    | { symbol: NetworkSymbol; type: 'default'; urls?: unknown };
const setBackend = createAction(
    `${BLOCKCHAIN_MODULE_PREFIX}/setBackend`,
    (payload: SetBackendPayload) => ({
        payload,
    }),
);

const setBackendGapLimit = createAction(
    `${BLOCKCHAIN_MODULE_PREFIX}/setBackendGapLimit`,
    (payload: { symbol: NetworkSymbol; gapLimit: number | undefined }) => ({ payload }),
);

export const blockchainActions = {
    setBackend,
    setBackendGapLimit,
    connected,
    synced,
};
