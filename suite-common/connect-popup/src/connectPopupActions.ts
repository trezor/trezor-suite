import { createAction } from '@reduxjs/toolkit';

import { type PermissionRequest } from '@trezor/connect';

import {
    type AppRememberedPermission,
    type ConnectPopupCall,
    type ConnectPopupCallWithState,
    type ConnectSerializedError,
} from './connectPopupTypes';

const ACTION_PREFIX = '@suite-common/connect-popup';

type InitiateCallPayload = Pick<
    ConnectPopupCall & { state: 'ongoing' },
    'method' | 'methodInfo' | 'source' | 'payload'
>;

const initiateCall = createAction(
    `${ACTION_PREFIX}/initiateCall`,
    (payload: InitiateCallPayload) => ({
        payload,
    }),
);

const requestPermissions = createAction(`${ACTION_PREFIX}/requestPermissions`);

const approvePermissions = createAction(`${ACTION_PREFIX}/approvePermissions`);

const rejectPermissions = createAction(`${ACTION_PREFIX}/rejectPermissions`, (payload: Error) => ({
    payload,
}));

const finishCall = createAction(`${ACTION_PREFIX}/finishCall`);

const clearCall = createAction(`${ACTION_PREFIX}/clearCall`);

type ConfirmAddressesPayload = Pick<
    ConnectPopupCall & { state: 'address-confirmation' },
    'addresses' | 'exported'
>;

const confirmAddresses = createAction(
    `${ACTION_PREFIX}/confirmAddresses`,
    (payload: ConfirmAddressesPayload) => ({
        payload,
    }),
);

type SelectAccountPayload = Pick<
    ConnectPopupCallWithState<'select-account'>,
    'options' | 'selectedAccountTypeKey' | 'candidates' | 'page' | 'exported' | 'manualPhase'
>;

const selectAccount = createAction(
    `${ACTION_PREFIX}/selectAccount`,
    (payload: SelectAccountPayload) => ({
        payload,
    }),
);

type UpdateSelectAccountPayload = Partial<
    Pick<
        ConnectPopupCallWithState<'select-account'>,
        | 'selectedAccountTypeKey'
        | 'candidates'
        | 'page'
        | 'exported'
        | 'totalCandidates'
        | 'manualPhase'
        | 'manualAccountIndex'
        | 'loadingKey'
        | 'loadEpoch'
    >
>;

const updateSelectAccount = createAction(
    `${ACTION_PREFIX}/updateSelectAccount`,
    (payload: UpdateSelectAccountPayload) => ({
        payload,
    }),
);

type SetSelectedAccountKeyPayload = Pick<
    ConnectPopupCall & { state: 'ongoing' },
    'selectedAccountKey'
>;

const setSelectedAccountKey = createAction(
    `${ACTION_PREFIX}/setSelectedAccountKey`,
    (payload: SetSelectedAccountKeyPayload) => ({
        payload,
    }),
);

type DeeplinkCallbackPayload = Pick<
    ConnectPopupCall & { state: 'deeplink-callback' },
    'callbackUrl'
>;

const deeplinkCallback = createAction(
    `${ACTION_PREFIX}/deeplinkCallback`,
    (payload: DeeplinkCallbackPayload) => ({
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

const forgetAppPermission = createAction(
    `${ACTION_PREFIX}/forgetAppPermission`,
    (payload: { origin: string; permission: PermissionRequest }) => ({
        payload,
    }),
);

const setAppSilentMode = createAction(
    `${ACTION_PREFIX}/setAppSilentMode`,
    (payload: { origin: string; silentMode: boolean }) => ({
        payload,
    }),
);

type TxSimulationPayload = Pick<ConnectPopupCallWithState<'tx-simulation'>, 'fromAddress'>;

const txSimulation = createAction(
    `${ACTION_PREFIX}/txSimulation`,
    (payload: TxSimulationPayload) => ({
        payload,
    }),
);

type SetSelectedFeePayload = Pick<
    ConnectPopupCallWithState<'tx-simulation' | 'ongoing'>,
    'selectedFee'
>;

const setSelectedFee = createAction(
    `${ACTION_PREFIX}/txSimulationSetFee`,
    (payload: SetSelectedFeePayload) => ({
        payload,
    }),
);

const switchDevice = createAction(`${ACTION_PREFIX}/switchDevice`);

export const connectPopupActions = {
    initiateCall,
    requestPermissions,
    approvePermissions,
    rejectPermissions,
    finishCall,
    confirmAddresses,
    selectAccount,
    updateSelectAccount,
    setSelectedAccountKey,
    deeplinkCallback,
    setError,
    rememberAppPermissions,
    forgetAppPermissions,
    forgetAppPermission,
    setAppSilentMode,
    txSimulation,
    setSelectedFee,
    switchDevice,
    clearCall,
} as const;
