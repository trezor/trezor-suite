import { MiddlewareAPI } from 'redux';

import { ROUTER } from 'src/actions/suite/constants';
import { Action, AppState, Dispatch } from 'src/types/suite';

const router = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
    const { router } = api.getState();

    switch (action.type) {
        case ROUTER.LOCATION_CHANGE:
            /**
             * Store back route for navigation when closing the settings.
             * Exclude settings routes – we want to close the settings and not just switch the settings tab...
             * Exclude foreground apps – to prevent going back to modals and other unexpected states.
             */
            if (router.app !== 'settings' && !router.route?.isForegroundApp) {
                return next({
                    ...action,
                    payload: {
                        ...action.payload,
                        settingsBackRoute: {
                            name: router.route?.name ?? 'suite-index',
                            // @ts-expect-error: Tightening types, but I don't know how to resolve this.
                            params: router.params,
                        },
                    },
                });
            }

            break;
        default:
            break;
    }

    return next(action);
};

export default router;
