import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import * as backupActions from '@backup-actions/backupActions';
import { AppState, Action, Dispatch } from '@suite-types';

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
