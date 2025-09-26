import { createAction } from '@reduxjs/toolkit';

import { ThpSuiteCredentials } from '@suite-common/suite-types';
import { DeviceUniquePath } from '@trezor/connect';
import { ThpCredentials } from '@trezor/protocol';

export const THP_PREFIX = '@suite/thp';

const invalidCode = createAction(
    `${THP_PREFIX}/invalid-pin-action`,
    (payload: { path: DeviceUniquePath }) => ({ payload }),
);

const finishThpFlow = createAction(
    `${THP_PREFIX}/finish-thp-flow`,
    (payload: { path: DeviceUniquePath }) => ({ payload }),
);

const cancelThpFlow = createAction(
    `${THP_PREFIX}/cancel-thp-flow`,
    (payload: { path: DeviceUniquePath }) => ({ payload }),
);

export const showAutoconnectInfo = createAction(
    `${THP_PREFIX}/showAutoconnectInfo`,
    (payload: { path: DeviceUniquePath }) => ({ payload }),
);

export const setLastThpCode = createAction(
    `${THP_PREFIX}/set-last-thp-code`,
    (payload: { code: string; path: DeviceUniquePath }) => ({ payload }),
);

export const incrementCredentialConnectionCounter = createAction(
    `${THP_PREFIX}/increment-credential-connection-counter`,
    (payload: { credential: ThpSuiteCredentials }) => ({ payload }),
);

export const addCredential = createAction(
    `${THP_PREFIX}/add-credential`,
    (payload: { credential: ThpCredentials }) => ({ payload }),
);

export const removeCredentials = createAction(
    `${THP_PREFIX}/removeCredentials`,
    (payload: { credentials: ThpCredentials[] }) => ({ payload }),
);

export const removeAllCredentials = createAction(`${THP_PREFIX}/removeAllCredentials`);

export const thpActions = {
    invalidCode,
    finishThpFlow,
    addCredential,
    cancelThpFlow,
    removeCredentials,
    removeAllCredentials,
    setLastThpCode,
    showAutoconnectInfo,
    incrementCredentialConnectionCounter,
};
