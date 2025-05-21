import { createAction } from '@reduxjs/toolkit';

import { ThpSuiteCredentials } from '@suite-common/suite-types';
import { ThpCredentials } from '@trezor/protocol';

export const THP_PREFIX = '@suite/thp';

const invalidCode = createAction(`${THP_PREFIX}/invalid-pin-action`);

const resetThpFlow = createAction(`${THP_PREFIX}/cancel-thp-flow`);

export const showAutoconnectInfo = createAction(`${THP_PREFIX}/showAutoconnectInfo`);

export const setLastThpCode = createAction(
    `${THP_PREFIX}/set-last-thp-code`,
    (payload: { code: string }) => ({
        payload,
    }),
);

export const incrementCredentialConnectionCounter = createAction(
    `${THP_PREFIX}/increment-credential-connection-counter`,
    (payload: { credential: ThpSuiteCredentials }) => ({
        payload,
    }),
);

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

export const thpActions = {
    invalidCode,
    resetThpFlow,
    addCredential,
    removeCredentials,
    setLastThpCode,
    showAutoconnectInfo,
    incrementCredentialConnectionCounter,
};
