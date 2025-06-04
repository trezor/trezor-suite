import { AnyAction } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { ThpSuiteCredentials } from '@suite-common/suite-types';
import {
    DEVICE,
    DeviceButtonRequest,
    DeviceThpCredentialsChanged,
    UI,
    UiRequestConfirmation,
    UiRequestThpPairing,
} from '@trezor/connect';

import { thpActions } from './thpActions';

export const THP_BUTTON_REQUESTS_NAMES = [
    'thp_pairing_request',
    'thp_connection_request',
    'thp_autoconnect_credential_request',
] as const;

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
    | 'AutoconnectInfo'
    | 'Autoconnect'
    // Currently relevant only for Firmware Update / Custom Firmware & Onboarding Firmware
    | 'BeforeConnectionInfo'
    | null;

export type ThpState = {
    step: ThpStep;
    lastThpCode?: string;
    credentials: ThpSuiteCredentials[];
    // staticKey for the application.
    // this value is generated at first THP pairing and should never change. will be used for all future pairings
    staticKey?: string;
};

const initialState: ThpState = {
    step: null,
    lastThpCode: undefined,
    credentials: [] as ThpSuiteCredentials[],
};

export const prepareThpReducer = createReducerWithExtraDeps<ThpState>(
    initialState,
    (builder, extra) =>
        builder
            .addCase(thpActions.resetThpFlow, state => {
                state.step = null;
            })
            .addCase(thpActions.invalidCode, state => {
                state.step = 'CodeInvalid';
            })
            .addCase(thpActions.setLastThpCode, (state, { payload }) => {
                state.lastThpCode = payload.code;
            })
            .addCase(thpActions.showAutoconnectInfo, state => {
                state.step = 'AutoconnectInfo';
            })
            .addCase(thpActions.incrementCredentialConnectionCounter, (state, { payload }) => {
                const credentialToUpdate = state.credentials.find(
                    it => it.credential == payload.credential.credential,
                );

                if (credentialToUpdate !== undefined) {
                    credentialToUpdate.connectionCounter = credentialToUpdate.connectionCounter + 1;
                }
            })
            .addCase(thpActions.addCredential, (state, { payload }) => {
                state.credentials.push({ ...payload.credential, connectionCounter: 0 });
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
            .addMatcher(
                action => action.type === UI.REQUEST_THP_PAIRING,
                state => {
                    state.step = 'CodeEntry';
                },
            )
            .addMatcher(
                action => action.type === DEVICE.THP_CREDENTIALS_CHANGED,
                (state, action: DeviceThpCredentialsChanged) => {
                    const { credentials, staticKey } = action.payload;

                    state.credentials.push({
                        ...credentials,
                        connectionCounter: 0,
                    });
                    state.staticKey = staticKey;
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
                            state.step = 'Autoconnect';
                            break;
                    }
                },
            )
            // This is the THP flow in Firmware Update
            .addMatcher<DeviceButtonRequest | UiRequestThpPairing | UiRequestConfirmation>(
                action => action.type === UI.REQUEST_CONFIRMATION || action.type === DEVICE.BUTTON,
                (state, action) => {
                    // The THP device is ready for pairing, wait for user action
                    if (action.type === UI.REQUEST_CONFIRMATION) {
                        if (action.payload.view === 'thp-pairing-start') {
                            state.step = 'BeforeConnectionInfo';
                        }
                        if (action.payload.view === 'thp-pairing-failed') {
                            state.step = 'CodeInvalid';
                        }
                    }

                    // Handle button requests in the THP pairing
                    if (action.type === DEVICE.BUTTON) {
                        if (action.payload.name === 'thp_pairing_request') {
                            state.step = 'ConfirmConnectionBeforePairing';
                        }
                        if (action.payload.name === 'thp_connection_request') {
                            state.step = 'ConfirmOnlyConnection';
                        }
                        if (action.payload.name === 'thp_autoconnect_credential_request') {
                            state.step = 'Autoconnect';
                        }
                    }
                },
            )
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                (state, action: AnyAction) => {
                    state.credentials = action.payload.thp?.credentials ?? [];
                    state.staticKey = action.payload.thp?.staticKey;
                },
            ),
);
