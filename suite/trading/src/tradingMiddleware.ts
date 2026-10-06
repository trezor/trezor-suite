import { type UnknownAction } from '@reduxjs/toolkit';

import { routerLocationChange } from '@suite/router';
import {
    type GeolocationRootState,
    fetchCountryCodeThunk,
    selectCountryCode,
} from '@suite-common/geolocation';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { shouldFetchCountryCode } from './geolocation';

type TradingMiddlewareState = GeolocationRootState;

export const tradingMiddleware = createMiddlewareWithExtraDeps<
    void,
    UnknownAction,
    TradingMiddlewareState
>((action, { dispatch, next, getState }) => {
    if (
        routerLocationChange.match(action) &&
        selectCountryCode(getState()) == null &&
        shouldFetchCountryCode(action.payload.route?.name)
    ) {
        dispatch(fetchCountryCodeThunk());
    }

    return next(action);
});
