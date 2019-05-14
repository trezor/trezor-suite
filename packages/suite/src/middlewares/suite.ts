import { MiddlewareAPI } from 'redux';
import { INIT } from '@suite/actions/SuiteActions';
import { load } from '@suite/actions/StorageActions';
import { State, Action, Dispatch } from '@suite/types';

const suite = (api: MiddlewareAPI<Dispatch, State>) => (next: Dispatch) => (action: Action): Action => {

    // pass action
    next(action);
    
    switch (action.type) {
        case INIT:
            api.dispatch(load());
            break;
        default:
            break;
    }
    return action;
}

export default suite;