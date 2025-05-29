import { differenceInMinutes } from 'date-fns';

import type { HandshakeElectron } from '@trezor/suite-desktop-api';

import { SUITE } from 'src/actions/suite/constants';
import { Action, AppState } from 'src/types/suite';

export type DesktopState = {
    bioAuthEnabled: boolean;
    bioAuthEnabledNextValue: null | boolean;
    lastBioAuthValidatedTimestamp: null | string;
    lastWindowBlurTimestamp: null | string;
    windowBlurred: boolean;
    bioAuthValidationRequested: boolean;
} & Partial<Pick<HandshakeElectron, 'paths' | 'urls'>>;

const initialState: DesktopState = {
    bioAuthEnabled: false,
    bioAuthEnabledNextValue: null,
    lastBioAuthValidatedTimestamp: null,
    lastWindowBlurTimestamp: null,
    windowBlurred: false,
    bioAuthValidationRequested: false,
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
        case SUITE.REQUEST_BIO_AUTH_VALIDATED:
            return {
                ...state,
                lastBioAuthValidatedTimestamp: action.payload?.toUTCString() ?? null,
                bioAuthValidationRequested: false,
                lastWindowBlurTimestamp: null,
            };

        case SUITE.BIO_AUTH_WINDOW_BLUR:
            return {
                ...state,
                lastWindowBlurTimestamp: action.payload.toUTCString(),
                windowBlurred: true,
            };

        case SUITE.BIO_AUTH_WINDOW_FOCUS:
            return {
                ...state,
                windowBlurred: false,
                lastWindowBlurTimestamp: null,
            };

        case SUITE.TOGGLE_BIO_AUTH_VALIDATION_REQUESTED:
            return {
                ...state,
                bioAuthValidationRequested: action.payload,
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

export const selectLastBioAuthValidatedTimestamp = (state: AppState) =>
    state.desktop.lastBioAuthValidatedTimestamp;

export const selectIsBioAuthValidationRequired = (
    state: AppState,
    timestamp: Date = new Date(),
) => {
    if (!selectBioAuthEnabled(state)) {
        return false;
    }

    const lastBioAuthValidatedTimestamp = selectLastBioAuthValidatedTimestamp(state);
    if (!lastBioAuthValidatedTimestamp) {
        return true;
    }

    const dayInMinutes = 24 * 60;
    const isValidationExpired =
        differenceInMinutes(timestamp, new Date(lastBioAuthValidatedTimestamp)) > dayInMinutes;

    const fiveMinutesInMinutes = 5;
    const isBlurredTooLong =
        state.desktop.lastWindowBlurTimestamp &&
        differenceInMinutes(timestamp, new Date(state.desktop.lastWindowBlurTimestamp)) >
            fiveMinutesInMinutes;

    return Boolean(isValidationExpired || isBlurredTooLong);
};

export const selectIsBioAuthValidationRequested = (state: AppState) =>
    state.desktop.bioAuthValidationRequested;

export const selectIsAppUiHidden = (state: AppState) =>
    (state.desktop.windowBlurred && selectBioAuthEnabled(state)) ||
    selectIsBioAuthValidationRequested(state);

export const selectIsWindowFocused = (state: AppState) => !state.desktop.windowBlurred;
