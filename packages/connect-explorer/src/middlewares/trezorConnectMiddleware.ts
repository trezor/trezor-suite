import { MiddlewareAPI } from 'redux';

import { Dispatch, AppState, Action } from '../types';
import { ON_LOCATION_CHANGE } from '../actions';
import { init } from '../actions/trezorConnectActions';

export const trezorConnectMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
        const prevConnectOptions = api.getState().connect.options;

        next(action);

        if (action.type === ON_LOCATION_CHANGE && !prevConnectOptions) {
            // TODO: just for dev! still need to figure out best way to pass proper src to web-extension version of connect-explorer
            // const connectSrc = getQueryVariable('src');
            // const connectSrc = 'http://localhost:8088';
            const connectSrc =
                'https://suite.corp.sldev.cz/connect/feat/connect-explorer-serviceworker-proxy/';
            const options = {};
            if (connectSrc) {
                Object.assign(options, { connectSrc });
            }
            api.dispatch(init(options));
        }
    };
