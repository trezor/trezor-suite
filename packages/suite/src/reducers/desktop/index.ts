import { SUITE } from 'src/actions/suite/constants';
import { Action } from 'src/types/suite';
import type { HandshakeElectron } from '@trezor/suite-desktop-api';

export type DesktopState = null | Pick<HandshakeElectron, 'paths' | 'urls'>;

const initialState: DesktopState = null;

export const desktopReducer = (
    state: DesktopState = initialState,
    action: Action,
): DesktopState => {
    switch (action.type) {
        case SUITE.DESKTOP_HANDSHAKE:
            return action.payload;
        default:
            return state;
    }
};
