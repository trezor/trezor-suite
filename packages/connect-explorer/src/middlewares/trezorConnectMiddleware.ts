import { type MiddlewareAPI } from 'redux';

import { init } from '../actions/trezorConnectActions';
import { type Action, type AppState, type Dispatch } from '../types';
import { SET_METHOD, SET_SCHEMA } from '../types/actions';

export const trezorConnectMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
        const prevConnectOptions = api.getState().connect.options;

        next(action);

        if ([SET_SCHEMA, SET_METHOD].includes(action.type) && !prevConnectOptions) {
            const options = {};
            api.dispatch(init(options));
        }
    };
