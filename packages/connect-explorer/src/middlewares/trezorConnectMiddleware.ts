import { MiddlewareAPI } from 'redux';

import { SET_METHOD, SET_SCHEMA } from '../actions';
import { init } from '../actions/trezorConnectActions';
import { Action, AppState, Dispatch } from '../types';
import { getQueryVariable } from '../utils/windowUtils';

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
