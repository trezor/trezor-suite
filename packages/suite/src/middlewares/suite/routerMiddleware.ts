import { MiddlewareAPI } from 'redux';

import { fetchCountryCodeThunk } from '@suite-common/geolocation';

import { ROUTER } from 'src/actions/suite/constants';
import { Action, AppState, Dispatch } from 'src/types/suite';
import { shouldFetchCountryCode } from 'src/utils/suite/geolocation';

const router = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
    const { router, geolocation } = api.getState();

    switch (action.type) {
        case ROUTER.LOCATION_CHANGE: {
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
        }
        default:
            break;
    }

    return next(action);
};

export default router;
