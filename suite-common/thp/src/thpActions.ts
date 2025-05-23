import { createAction } from '@reduxjs/toolkit';

import { ThpSuiteCredentials } from '@suite-common/suite-types';

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

export const thpActions = {
    invalidCode,
    resetThpFlow,
    setLastThpCode,
    showAutoconnectInfo,
    incrementCredentialConnectionCounter,
};
