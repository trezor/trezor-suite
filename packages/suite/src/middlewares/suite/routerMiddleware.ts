/* eslint-disable @typescript-eslint/naming-convention */

import { MiddlewareAPI } from 'redux';
import { ROUTER } from '@suite-actions/constants';

import { AppState, Action, Dispatch } from '@suite-types';

const router = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
    switch (action.type) {
        case ROUTER.LOCATION_CHANGE:
            {
                const { router } = api.getState();

                if (router.app !== 'settings' && action.payload.app === 'settings') {
                    return next({
                        ...action,
                        payload: {
                            ...action.payload,
                            settingsBackRoute: {
                                name: router.route?.name ?? 'suite-index',
                                params: router.params,
                            },
                        },
                    });
                }
            }
            break;
        default:
            break;
    }
    return next(action);
};

export default router;
