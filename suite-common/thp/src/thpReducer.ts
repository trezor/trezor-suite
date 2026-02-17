import { AnyAction } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { ThpSuiteCredentials } from '@suite-common/suite-types';
import {
    DEVICE,
    DeviceThpCredentialsChanged,
    DeviceThpPairingStatusChanged,
    UI,
} from '@trezor/connect';
import type { ThpCredentials } from '@trezor/protocol';

import { thpActions } from './thpActions';
import { CONNECTION_COUNTER_LIMIT, THP_BUTTON_REQUESTS_NAMES } from './thpConstants';

export type THPButtonRequestName = (typeof THP_BUTTON_REQUESTS_NAMES)[number];

export type ThpStep =
    // I don't have credentials, and the user has to
    //    1) confirm connection
    //    2) do the THP pairing afterwords
    | 'ConfirmConnectionBeforePairing'
    // I have credentials and the user only confirms the connection
    | 'ConfirmOnlyConnection'
    | 'CodeEntry'
    | 'CodeInvalid'
    // Currently relevant only for Firmware Update / Custom Firmware & Onboarding Firmware
    | 'BeforeConnectionInfo'
    | null;

export type ThpAutoconnectStep = 'AutoconnectInfo' | 'Autoconnect';

export type ThpState = {
    step: ThpStep;
    autoconnectStep: ThpAutoconnectStep | null;
    lastThpCode?: string;
    lastResult?: 'finished' | 'canceled' | 'failed';
    credentials: ThpSuiteCredentials[];
};

export const initialThpState: ThpState = {
    step: null,
    autoconnectStep: null,
    lastThpCode: undefined,
    lastResult: undefined,
    credentials: [] as ThpSuiteCredentials[],
};

const addCredential = (credentials: ThpSuiteCredentials[], credential: ThpCredentials) =>
    credentials
        .filter(c => c.trezor_static_public_key !== credential.trezor_static_public_key)
        .concat([{ ...credential, connectionCounter: 0 }]);

export const prepareThpReducer = createReducerWithExtraDeps<ThpState>(
    initialThpState,
    (builder, extra) =>
        builder
            .addCase(thpActions.invalidCode, state => {
                state.step = 'CodeInvalid';
            })
            .addCase(thpActions.setLastThpCode, (state, { payload }) => {
                state.lastThpCode = payload.code;
            })
            .addCase(thpActions.showAutoconnectInfo, state => {
                state.autoconnectStep = 'AutoconnectInfo';
            })
            .addCase(thpActions.incrementCredentialConnectionCounter, (state, { payload }) => {
                const credentialToUpdate = state.credentials.find(
                    it => it.credential == payload.credential.credential,
                );

                if (
                    credentialToUpdate !== undefined &&
                    credentialToUpdate.connectionCounter < CONNECTION_COUNTER_LIMIT
                ) {
                    credentialToUpdate.connectionCounter = credentialToUpdate.connectionCounter + 1;
                }
            })
            .addCase(thpActions.addCredential, (state, { payload }) => {
                state.credentials = addCredential(state.credentials, payload.credential);
            })
            .addCase(thpActions.removeCredentials, (state, { payload }) => {
                state.credentials = state.credentials.filter(
                    stateCredential =>
                        !payload.credentials.some(
                            payloadCredential =>
                                stateCredential.credential === payloadCredential.credential,
                        ),
                );
            })
            .addCase(thpActions.removeAllCredentials, state => {
                state.credentials = [];
            })
            .addCase(thpActions.finishThpFlow, state => {
                state.step = null;
                state.lastResult = 'finished';
            })
            .addCase(thpActions.cancelThpFlow, state => {
                state.step = null;
                state.lastResult = 'canceled';
            })
            .addCase(thpActions.finishAutoconnectFlow, state => {
                state.autoconnectStep = null;
            })
            .addMatcher(
                action => action.type === UI.REQUEST_THP_PAIRING,
                state => {
                    state.step = 'CodeEntry';
                },
            )
            .addMatcher(
                action => action.type === DEVICE.THP_CREDENTIALS_CHANGED,
                (state, action: DeviceThpCredentialsChanged) => {
                    const { credentials } = action.payload;

                    state.credentials = addCredential(state.credentials, credentials);
                },
            )
            .addMatcher(
                action => action.type === DEVICE.THP_PAIRING_STATUS_CHANGED,
                (state, action: DeviceThpPairingStatusChanged) => {
                    const { payload } = action;
                    if (payload.status === 'finished') {
                        state.step = null;
                        state.lastThpCode = undefined;
                        state.lastResult = 'finished';

                        // find credential and increment connectionCounter or set autoconnectStep
                        const credential = state.credentials.find(stateCredential =>
                            payload.device.thp?.credentials.some(
                                deviceCredential =>
                                    deviceCredential.credential === stateCredential.credential,
                            ),
                        );
                        if (
                            credential &&
                            !credential.autoconnect &&
                            credential.connectionCounter < CONNECTION_COUNTER_LIMIT
                        ) {
                            credential.connectionCounter += 1;
                            if (credential.connectionCounter === CONNECTION_COUNTER_LIMIT) {
                                state.autoconnectStep = 'AutoconnectInfo';
                            }
                        }
                    } else if (payload.status === 'invalid-tag') {
                        state.step = 'CodeInvalid';
                        state.lastThpCode = payload.tag;
                    } else if (payload.status === 'canceled' || payload.status === 'failed') {
                        state.step = null;
                        state.lastThpCode = undefined;
                        state.lastResult = payload.status;
                    }
                },
            )
            .addMatcher(
                action => action.type === UI.REQUEST_BUTTON,
                (state, action: AnyAction) => {
                    const actionName: THPButtonRequestName = action.payload.name;
                    switch (actionName) {
                        case 'thp_pairing_request':
                            state.step = 'ConfirmConnectionBeforePairing';
                            break;
                        case 'thp_connection_request':
                            state.step = 'ConfirmOnlyConnection';
                            break;
                        case 'thp_autoconnect_credential_request':
                            state.autoconnectStep = 'Autoconnect';
                            break;
                    }
                },
            )
            // This is the THP flow in Firmware Update
            .addMatcher(
                action => action.type === UI.REQUEST_CONFIRMATION,
                state => {
                    if (state.step !== 'CodeInvalid') {
                        state.step = 'BeforeConnectionInfo';
                    }
                },
            )
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                (state, action: AnyAction) => {
                    state.credentials = action.payload.thp?.credentials ?? [];
                },
            ),
);
