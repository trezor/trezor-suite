import { type MiddlewareAPI } from 'redux';

import { backupActions } from '@suite/backup';
import { routerAppChanged } from '@suite/router';

import { type Action, type AppState, type Dispatch } from 'src/types/suite';

const backupMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const prevApp = api.getState().router.app;
        // pass action
        next(action);

        if (action.type === routerAppChanged.type && ['backup', 'onboarding'].includes(prevApp)) {
            api.dispatch(backupActions.resetReducer());
        }

        return action;
    };
export default backupMiddleware;
