import { MiddlewareAPI } from 'redux';

import { appChanged } from '@suite/router';

import * as backupActions from 'src/actions/backup/backupActions';
import { Action, AppState, Dispatch } from 'src/types/suite';

const backup =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const prevApp = api.getState().router.app;
        // pass action
        next(action);

        if (action.type === appChanged.type && ['backup', 'onboarding'].includes(prevApp)) {
            api.dispatch(backupActions.resetReducer());
        }

        return action;
    };
export default backup;
