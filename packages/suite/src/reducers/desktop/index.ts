import { SUITE } from '@suite-actions/constants';
import { Action } from '@suite-types';
import type { HandshakeElectron } from '@trezor/suite-desktop-api';

export type DesktopState = null | Pick<HandshakeElectron, 'paths'>;

const initialState: DesktopState = null;

export const desktopReducer = (state: DesktopState = initialState, action: Action) => {
    switch (action.type) {
        case SUITE.DESKTOP_HANDSHAKE:
            return action.payload;
        default:
            return state;
    }
};
