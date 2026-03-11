import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { routerAppChanged, routerLocationChange, selectRouter } from './routerReducer';

export const routerMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, getState, next }) => {
        const prevRouter = selectRouter(getState());

        if (routerLocationChange.match(action)) {
            if (prevRouter.app !== action.payload.app) {
                dispatch(routerAppChanged(action.payload.app));
            }

            if (prevRouter.app !== 'settings' && !prevRouter.route?.isForegroundApp) {
                return next({
                    ...action,
                    payload: {
                        ...action.payload,
                        settingsBackRoute: {
                            name: prevRouter.route?.name ?? 'suite-index',
                            params: prevRouter.params,
                        },
                    },
                });
            }
        }

        return next(action);
    },
);
