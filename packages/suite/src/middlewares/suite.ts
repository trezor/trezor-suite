import { MiddlewareAPI } from 'redux';
import { TRANSPORT } from 'trezor-connect';
import { INIT, onSuiteReady } from '@suite/actions/SuiteActions';
import { load, LOADED } from '@suite/actions/StorageActions';
import { init } from '@suite/actions/TrezorConnectActions';
import { State, Action, Dispatch } from '@suite/types';

const suite = (api: MiddlewareAPI<Dispatch, State>) => (next: Dispatch) => (action: Action): Action => {

    // pass action
    next(action);
    
    switch (action.type) {
        case INIT:
            // load storage
            api.dispatch(load());
            break;
        case LOADED:
            // load TrezorConnect
            api.dispatch(init());
            break;
        case TRANSPORT.START:
            api.dispatch(onSuiteReady());
            break;
        default:
            break;
    }
    return action;
}

export default suite;