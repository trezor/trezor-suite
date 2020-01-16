import { MiddlewareAPI } from 'redux';
import { TRANSPORT } from 'trezor-connect';

import { AppState, Action, Dispatch } from '@suite-types';
import * as analyticsActions from '@suite-actions/analyticsActions';

/*
    In analytics middleware we may intercept actions we would like to log. For example:
    - trezor model
    - firmware version
    - transport (webusb/bridge) and its version
    - backup type (shamir/bip39)
*/

const analytics = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    switch (action.type) {
        case TRANSPORT.START:
            // todo: decide how to structure data. domain here is just an example tag
            api.dispatch(
                analyticsActions.log({
                    domain: 'transport',
                    type: action.payload.type,
                    version: action.payload.version,
                }),
            );
            break;
        default:
            break;
    }
    return action;
};

export default analytics;
