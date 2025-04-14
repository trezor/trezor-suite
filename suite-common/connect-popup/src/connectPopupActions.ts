import { createAction } from '@reduxjs/toolkit';

import {
    AppRememberedPermission,
    ConnectPopupCall,
    ConnectSerializedError,
} from './connectPopupTypes';

export const ACTION_PREFIX = '@suite-common/connect-popup';

const initiateCall = createAction(
    `${ACTION_PREFIX}/initiateCall`,
    (
        payload: Pick<
            ConnectPopupCall & { state: 'ongoing' },
            'method' | 'methodInfo' | 'source' | 'payload'
        >,
    ) => ({
        payload,
    }),
);

const requestPermissions = createAction(
    `${ACTION_PREFIX}/requestPermissions`,
    (payload: Pick<ConnectPopupCall & { state: 'permission-request' }, 'permissionDecision'>) => ({
        payload,
    }),
);

const approvePermissions = createAction(`${ACTION_PREFIX}/approvePermissions`);

const rejectPermissions = createAction(`${ACTION_PREFIX}/rejectPermissions`, (payload: Error) => ({
    payload,
}));

const finishCall = createAction(`${ACTION_PREFIX}/finishCall`);

const confirmAddresses = createAction(
    `${ACTION_PREFIX}/confirmAddresses`,
    (payload: Pick<ConnectPopupCall & { state: 'address-confirmation' }, 'addresses'>) => ({
        payload,
    }),
);

const setSelectedAccountKey = createAction(
    `${ACTION_PREFIX}/setSelectedAccountKey`,
    (payload: Pick<ConnectPopupCall & { state: 'ongoing' }, 'selectedAccountKey'>) => ({
        payload,
    }),
);

const deeplinkCallback = createAction(
    `${ACTION_PREFIX}/deeplinkCallback`,
    (payload: Pick<ConnectPopupCall & { state: 'deeplink-callback' }, 'callbackUrl'>) => ({
        payload,
    }),
);

const setError = createAction(`${ACTION_PREFIX}/setError`, (payload: ConnectSerializedError) => ({
    payload,
}));

const rememberAppPermissions = createAction(
    `${ACTION_PREFIX}/rememberAppPermissions`,
    (payload: AppRememberedPermission) => ({
        payload,
    }),
);

const forgetAppPermissions = createAction(
    `${ACTION_PREFIX}/forgetAppPermissions`,
    (payload: AppRememberedPermission) => ({
        payload,
    }),
);

export const connectPopupActions = {
    initiateCall,
    requestPermissions,
    approvePermissions,
    rejectPermissions,
    finishCall,
    confirmAddresses,
    setSelectedAccountKey,
    deeplinkCallback,
    setError,
    rememberAppPermissions,
    forgetAppPermissions,
} as const;
