import { type UnknownAction } from '@reduxjs/toolkit';

import { type TorRootState, TorStatus, selectTorStatus, torActions } from '@suite/tor';
import { geolocationActions } from '@suite-common/geolocation';
import { refreshPresenceIpCountryThunk } from '@suite-common/regions';
import { createMiddlewareWithExtraDeps } from '@trezor/redux-utils';

export const regionsMiddleware = createMiddlewareWithExtraDeps<void, UnknownAction, TorRootState>(
    (action, { dispatch, next, getState }) => {
        if (!torActions.setTorStatus.match(action)) {
            return next(action);
        }

        const previousStatus = selectTorStatus(getState());
        const result = next(action);

        if (previousStatus !== action.payload) {
            dispatch(geolocationActions.invalidateCountryCodeFetch());

            if (action.payload === TorStatus.Disabled) {
                dispatch(refreshPresenceIpCountryThunk({ isIpLookupAllowed: true }));
            }
        }

        return result;
    },
);
