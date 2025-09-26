import { AnyAction, isAnyOf } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { ThpSuiteCredentials } from '@suite-common/suite-types';
import {
    DEVICE,
    DeviceButtonRequest,
    DeviceThpCredentialsChanged,
    DeviceUniquePath,
    UI,
    UiRequestButton,
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
    | 'BeforeConnectionInfo';

export type ThpState = {
    step: Record<DeviceUniquePath, { step: ThpStep } | null>;
    lastThpCode?: string;
    credentials: ThpSuiteCredentials[];
    // staticKey for the application.
    // this value is generated at first THP pairing and should never change. will be used for all future pairings
    staticKey?: string;
};

export const initialThpState: ThpState = {
    step: {},
    lastThpCode: undefined,
    credentials: [] as ThpSuiteCredentials[],
};

export const prepareThpReducer = createReducerWithExtraDeps<ThpState>(
    initialThpState,
    (builder, extra) =>
        builder
            .addCase(thpActions.invalidCode, (state, { payload }) => {
                state.step[payload.path] = { step: 'CodeInvalid' };
            })
            .addCase(thpActions.setLastThpCode, (state, { payload }) => {
                state.lastThpCode = payload.code;
            })
            .addCase(thpActions.showAutoconnectInfo, (state, { payload }) => {
                state.step[payload.path] = { step: 'AutoconnectInfo' };
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
            .addCase(thpActions.removeAllCredentials, state => {
                state.credentials = [];
            })
            .addMatcher(
                isAnyOf(thpActions.finishThpFlow, thpActions.cancelThpFlow),
                (state, { payload }) => {
                    state.step[payload.path] = null;
                },
            )
            .addMatcher(
                action => action.type === UI.REQUEST_THP_PAIRING,
                (state, { payload }: UiRequestThpPairing) => {
                    state.step[payload.device.path] = { step: 'CodeEntry' };
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
                (state, action: UiRequestButton) => {
                    const devicePath = action.payload.device.path;
                    const actionName = action.payload.name as THPButtonRequestName;
                    switch (actionName) {
                        case 'thp_pairing_request':
                            state.step[devicePath] = { step: 'ConfirmConnectionBeforePairing' };
                            break;
                        case 'thp_connection_request':
                            state.step[devicePath] = { step: 'ConfirmOnlyConnection' };
                            break;
                        case 'thp_autoconnect_credential_request':
                            state.step[devicePath] = { step: 'Autoconnect' };
                            break;
                    }
                },
            )
            // This is the THP flow in Firmware Update
            .addMatcher<DeviceButtonRequest | UiRequestThpPairing | UiRequestConfirmation>(
                action => action.type === UI.REQUEST_CONFIRMATION || action.type === DEVICE.BUTTON,
                (state, action) => {
                    const devicePath = action.payload.device.path;

                    // The THP device is ready for pairing, wait for user action
                    if (action.type === UI.REQUEST_CONFIRMATION) {
                        if (action.payload.view === 'thp-pairing-start') {
                            state.step[devicePath] = { step: 'BeforeConnectionInfo' };
                        }
                        if (action.payload.view === 'thp-pairing-failed') {
                            state.step[devicePath] = { step: 'CodeInvalid' };
                        }
                    }

                    // Handle button requests in the THP pairing
                    if (action.type === DEVICE.BUTTON) {
                        if (action.payload.name === 'thp_pairing_request') {
                            state.step[devicePath] = { step: 'ConfirmConnectionBeforePairing' };
                        }
                        if (action.payload.name === 'thp_connection_request') {
                            state.step[devicePath] = { step: 'ConfirmOnlyConnection' };
                        }
                        if (action.payload.name === 'thp_autoconnect_credential_request') {
                            state.step[devicePath] = { step: 'Autoconnect' };
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
