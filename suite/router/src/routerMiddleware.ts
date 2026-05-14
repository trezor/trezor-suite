import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { routerAppChanged, routerLocationChange, selectRouter } from './routerReducer';

export const routerMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, getState, next }) => {
        const prevRouter = selectRouter(getState());

        // the routerLocationChange action is enough to change both app and route, but we are dispatching this no-op action to let other middlewares know, that an app has changed
        if (routerLocationChange.match(action)) {
            if (prevRouter.app !== action.payload.app) {
                dispatch(routerAppChanged(action.payload.app));
            }

            // Store back route for navigation when closing the settings.
            // Exclude settings routes – we want to close the settings and not just switch the settings tab...
            // Exclude foreground apps – to prevent going back to modals and other unexpected states.
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
