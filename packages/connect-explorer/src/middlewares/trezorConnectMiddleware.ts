import { type MiddlewareAPI } from 'redux';

import { init } from '../actions/trezorConnectActions';
import { type Action, type AppState, type Dispatch } from '../types';
import { SET_METHOD, SET_SCHEMA } from '../types/actions';

export const trezorConnectMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
        const prevConnectOptions = api.getState().connect.options;

        next(action);

        // Auto-init on the first method so the testing tool works out of the box (core mode is still
        // read from ?core-mode=). Reconfiguring is optional via the Connect settings panel.
        if ([SET_SCHEMA, SET_METHOD].includes(action.type) && !prevConnectOptions) {
            api.dispatch(init({}));
        }
    };
