import { routerAppChanged, selectRouterApp } from '@suite/router';
import { createMiddleware } from '@suite-common/redux-utils';

import { backupActions } from './backupReducer';

export const backupMiddleware = createMiddleware((action, { getState, next }) => {
    const prevApp = selectRouterApp(getState());

    // pass action
    next(action);

    if (action.type === routerAppChanged.type && ['backup', 'onboarding'].includes(prevApp)) {
        // This violates the "middlewares should be read-only" rule, but resetting
        // backup state on navigation away is an established pattern kept for compatibility.
        next(backupActions.resetReducer());
    }

    return action;
});
