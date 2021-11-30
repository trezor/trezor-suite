/* eslint-disable no-underscore-dangle */

import { MiddlewareAPI } from 'redux';
import TrezorConnect, { TRANSPORT_EVENT, DEVICE_EVENT, UI_EVENT, UI } from 'trezor-connect';

import { Dispatch, AppState, Action } from '../types';
import { getQueryVariable } from '../utils/windowUtils';
import { ON_CHANGE_CONNECT_OPTIONS, ON_LOCATION_CHANGE } from '../actions';
import { init } from '../actions/trezorConnectActions';

export const trezorConnectMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
        const prevConnectOptions = api.getState().connect.options;

        next(action);

        if (action.type === ON_LOCATION_CHANGE && !prevConnectOptions) {
            const connectSrc = getQueryVariable('src');
            const options = {};
            if (connectSrc) {
                Object.assign(options, { connectSrc });
            }
            api.dispatch(init(options));
        }
    };
