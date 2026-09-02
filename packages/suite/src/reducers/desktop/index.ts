import type { UnknownAction } from '@reduxjs/toolkit';

import type { HandshakeElectron } from '@trezor/suite-desktop-api';

import { desktopHandshake } from 'src/actions/suite/suiteActions';

export type DesktopState = null | Pick<HandshakeElectron, 'paths' | 'urls'>;

export type DesktopRootState = {
    desktop: DesktopState;
};

export const selectDesktopUserDataDirectory = (state: DesktopRootState) =>
    state.desktop?.paths.userDir;

const initialState: DesktopState = null;

export const desktopReducer = (
    state: DesktopState = initialState,
    action: UnknownAction,
): DesktopState => {
    if (desktopHandshake.match(action)) {
        return {
            ...state,
            ...action.payload,
        };
    }

    return state;
};
