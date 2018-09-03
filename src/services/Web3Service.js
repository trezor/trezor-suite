/* @flow */


import TrezorConnect, { TRANSPORT } from 'trezor-connect';
import * as WEB3 from 'actions/constants/web3';

import type {
    Middleware,
    MiddlewareAPI,
    MiddlewareDispatch,
    Action,
} from 'flowtype';

/**
 * Middleware
 */
const Web3Service: Middleware = (api: MiddlewareAPI) => (next: MiddlewareDispatch) => (action: Action): Action => {
    // pass action
    next(action);

    if (action.type === WEB3.START) {
        api.dispatch(WalletActions.clearUnavailableDevicesData(prevState, action.device));
    }

    return action;
};

export default Web3Service;