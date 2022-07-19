import { MiddlewareAPI } from 'redux';
import { AppState, Action, Dispatch } from '@suite-types';
import { PROCESS_MODE } from '@suite-common/suite-types';

// actionBlockerMiddleware serves one purpose only, to block certain actions based on activated device's processMode.
// processMode is set via suiteActions.setProcessMode func

const actionBlocker =
    (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
        const prevState = api.getState();

        // block actions restricted by device's process mode
        const processMode = prevState.suite.device?.processMode;
        if (processMode && PROCESS_MODE[processMode].blockedActions.includes(action.type)) {
            return action;
        }

        // pass action to reducers
        next(action);
        return action;
    };

export default actionBlocker;
