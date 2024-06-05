import { MiddlewareAPI } from 'redux';

import { Dispatch, AppState, Action } from '../types';
import { getQueryVariable } from '../utils/windowUtils';
import { SET_SCHEMA, SET_METHOD } from '../actions';
import { init } from '../actions/trezorConnectActions';

export const trezorConnectMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
        const prevConnectOptions = api.getState().connect.options;
        console.log('trezorConnectMiddleware', action, prevConnectOptions);

        next(action);

        if ([SET_SCHEMA, SET_METHOD].includes(action.type) && !prevConnectOptions) {
            const connectSrc = getQueryVariable('src');
            const options = {};
            if (connectSrc) {
                Object.assign(options, { connectSrc });
            }
            api.dispatch(init(options));
        }
    };
