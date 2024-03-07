import { MiddlewareAPI } from 'redux';

import { Dispatch, AppState, Action } from '../types';
import { getQueryVariable } from '../utils/windowUtils';
import { SET_METHOD } from '../actions';
import { init } from '../actions/trezorConnectActions';

export const trezorConnectMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
        const prevConnectOptions = api.getState().connect.options;

        next(action);

        if (action.type === SET_METHOD && !prevConnectOptions) {
            const connectSrc = getQueryVariable('src');
            const options = {};
            if (connectSrc) {
                Object.assign(options, { connectSrc });
            }
            api.dispatch(init(options));
        }
    };
