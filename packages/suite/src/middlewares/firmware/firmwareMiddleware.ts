import { firmwareActions } from '@suite-common/wallet-core';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

export const prepareFirmwareMiddleware = createMiddlewareWithExtraDeps(
    (action, { getState, dispatch, extra, next }) => {
        const {
            selectors: { selectRouterApp },
            actions: { appChanged },
        } = extra;
        const routerApp = selectRouterApp(getState());

        // pass action
        next(action);

        if (appChanged.match(action)) {
            // leaving firmware update context
            if (['firmware', 'firmware-type', 'onboarding'].includes(routerApp)) {
                dispatch(firmwareActions.resetReducer());
            }
        }

        return action;
    },
);
