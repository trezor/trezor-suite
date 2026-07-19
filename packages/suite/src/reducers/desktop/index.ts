import { type Action as ReduxAction } from 'redux';

import type { HandshakeElectron } from '@trezor/suite-desktop-api';

import { SUITE } from 'src/actions/suite/constants';
import { type SuiteAction } from 'src/actions/suite/suiteActions';

type DesktopHandshakeAction = Extract<SuiteAction, { type: typeof SUITE.DESKTOP_HANDSHAKE }>;

const isDesktopHandshakeAction = (action: ReduxAction): action is DesktopHandshakeAction =>
    action.type === SUITE.DESKTOP_HANDSHAKE;

export type DesktopState = null | Pick<HandshakeElectron, 'paths' | 'urls'>;

const initialState: DesktopState = null;

export const desktopReducer = (
    state: DesktopState = initialState,
    action: ReduxAction,
): DesktopState => {
    if (!isDesktopHandshakeAction(action)) {
        return state;
    }

    const desktopAction: DesktopHandshakeAction = action;

    switch (desktopAction.type) {
        case SUITE.DESKTOP_HANDSHAKE:
            return {
                ...state,
                ...desktopAction.payload,
            };

        default:
            return state;
    }
};
