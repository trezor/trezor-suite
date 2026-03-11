import { MiddlewareAPI } from 'redux';

import { appChanged, routerLocationChange } from '@suite/router';
import { fetchCountryCodeThunk } from '@suite-common/geolocation';

import { Action, AppState, Dispatch } from 'src/types/suite';
import { shouldFetchCountryCode } from 'src/utils/suite/geolocation';

const routerMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
        const { router: prevRouter, geolocation } = api.getState();

        switch (action.type) {
            case routerLocationChange.type: {
                if (prevRouter.app !== action.payload.app) {
                    api.dispatch(appChanged(action.payload.app));
                }

                // Fetch country code only when entering trading or staking routes
                if (
                    geolocation.countryCode == null &&
                    shouldFetchCountryCode(action.payload.route?.name)
                ) {
                    api.dispatch(fetchCountryCodeThunk());
                }

                /**
                 * Store back route for navigation when closing the settings.
                 * Exclude settings routes – we want to close the settings and not just switch the settings tab...
                 * Exclude foreground apps – to prevent going back to modals and other unexpected states.
                 */
                if (prevRouter.app !== 'settings' && !prevRouter.route?.isForegroundApp) {
                    // @ts-expect-error: Tightening types, but I don't know how to resolve this.
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

                break;
            }
            default:
                break;
        }

        return next(action);
    };

export default routerMiddleware;
