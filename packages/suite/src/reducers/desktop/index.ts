import { SUITE } from '@suite-actions/constants';
import { Action } from '@suite-types';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type DesktopState = null;

const initialState: DesktopState = null;

export const desktopReducer = (state: DesktopState = initialState, action: Action) => {
    switch (action.type) {
        case SUITE.DESKTOP_HANDSHAKE:
            // TODO add later
            return state;
        default:
            return state;
        // no default
    }
};
