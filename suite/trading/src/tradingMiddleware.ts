import { routerLocationChange } from '@suite/router';
import { fetchCountryCodeThunk, selectCountryCode } from '@suite-common/geolocation';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { shouldFetchCountryCode } from './geolocation';

export const tradingMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next, getState }) => {
        if (
            routerLocationChange.match(action) &&
            selectCountryCode(getState()) == null &&
            shouldFetchCountryCode(action.payload.route?.name)
        ) {
            dispatch(fetchCountryCodeThunk());
        }

        return next(action);
    },
);
