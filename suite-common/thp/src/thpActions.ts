import { createAction } from '@reduxjs/toolkit';

import { type ThpCredentials } from '@trezor/protocol';

export const THP_PREFIX = '@suite/thp';

const finishThpFlow = createAction(`${THP_PREFIX}/finish-thp-flow`);

const finishAutoconnectFlow = createAction(`${THP_PREFIX}/finish-autoconnect-flow`);

export const showAutoconnectInfo = createAction(`${THP_PREFIX}/showAutoconnectInfo`);

export const addCredential = createAction(
    `${THP_PREFIX}/add-credential`,
    (payload: { credential: ThpCredentials }) => ({
        payload,
    }),
);

export const removeCredentials = createAction(
    `${THP_PREFIX}/removeCredentials`,
    (payload: { credentials: ThpCredentials[] }) => ({
        payload,
    }),
);

export const removeAllCredentials = createAction(`${THP_PREFIX}/removeAllCredentials`);

export const thpActions = {
    finishThpFlow,
    finishAutoconnectFlow,
    addCredential,
    removeCredentials,
    removeAllCredentials,
    showAutoconnectInfo,
};
