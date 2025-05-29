import type { HandshakeElectron } from '@trezor/suite-desktop-api';

import { SUITE } from 'src/actions/suite/constants';
import { Action, AppState } from 'src/types/suite';

export type DesktopState = {
    bioAuthEnabled: boolean;
    bioAuthEnabledNextValue: null | boolean;
} & Partial<Pick<HandshakeElectron, 'paths' | 'urls'>>;

const initialState: DesktopState = {
    bioAuthEnabled: false,
    bioAuthEnabledNextValue: null,
};

export const desktopReducer = (
    state: DesktopState = initialState,
    action: Action,
): DesktopState => {
    switch (action.type) {
        case SUITE.DESKTOP_HANDSHAKE:
            return {
                ...state,
                ...action.payload,
            };

        case SUITE.SET_BIO_AUTH_ENABLED:
            return {
                ...state,
                bioAuthEnabled: action.payload,
            };

        case SUITE.REQUEST_BIO_AUTH_CHANGE:
            return {
                ...state,
                bioAuthEnabledNextValue: action.payload,
            };
        case SUITE.REQUEST_BIO_AUTH_CHANGE_END:
            return {
                ...state,
                bioAuthEnabledNextValue: null,
            };

        default:
            return state;
    }
};

export const selectBioAuthEnabled = (state: AppState) => state.desktop.bioAuthEnabled;

export const selectBioAuthChangeNextValue = (state: AppState) =>
    state.desktop.bioAuthEnabledNextValue;

export const selectIsRequestingBioAuthChange = (state: AppState) =>
    state.desktop.bioAuthEnabledNextValue !== null;
