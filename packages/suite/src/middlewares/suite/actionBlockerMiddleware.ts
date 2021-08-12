import { MiddlewareAPI } from 'redux';
import { UI } from 'trezor-connect';
import { AppState, Action, Dispatch } from '@suite-types';

// actionBlockerMiddleware serves one purpose only, to block certain actions based on activated device's processMode.
// processMode is set via suiteActions.setProcessMode func

// definition of blocked actions for each process mode
export const PROCESS_MODE = {
    'confirm-addr': {
        blockedActions: [UI.CLOSE_UI_WINDOW], // prevents closing the modal after user confirms the address on a device (Receive tab)
    },
    'sign-tx': {
        blockedActions: [UI.CLOSE_UI_WINDOW], // prevents closing the modal between sign and push process
    },
};

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
