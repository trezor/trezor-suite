import { MiddlewareAPI } from 'redux';

import * as backupActions from 'src/actions/backup/backupActions';
import { SUITE } from 'src/actions/suite/constants';
import { Action, AppState, Dispatch } from 'src/types/suite';

const backup =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const prevApp = api.getState().router.app;
        // pass action
        next(action);

        if (action.type === SUITE.APP_CHANGED && ['backup', 'onboarding'].includes(prevApp)) {
            api.dispatch(backupActions.resetReducer());
        }

        return action;
    };
export default backup;
