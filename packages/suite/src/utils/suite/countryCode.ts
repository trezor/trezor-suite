import { createThunk } from '@suite-common/redux-utils';
import { CountryCode } from '@suite-common/trading';
import { GEOLOCATION_API_URL } from '@trezor/urls';

import { setCountryCode } from 'src/actions/suite/suiteActions';

const GEOLOCATION_PREFIX = '@suite/geolocation';

type GeolocationResponse = {
    country: string;
};

export const shouldFetchCountryCode = (routeName: string | undefined) => {
    if (!routeName) return false;

    const isTradingRoute = routeName.includes('wallet-trading');
    const isStakingRoute = routeName.includes('staking');

    return isTradingRoute || isStakingRoute;
};

export const fetchCountryCodeThunk = createThunk<void, void, void>(
    `${GEOLOCATION_PREFIX}/fetchCountryCodeThunk`,
    async (_, { dispatch }) => {
        try {
            const response = await fetch(GEOLOCATION_API_URL);
            const data = (await response.json()) as GeolocationResponse;

            if (typeof data?.country === 'string') {
                const code = data.country.trim().toUpperCase() as unknown as CountryCode;
                dispatch(setCountryCode(code));
            }
        } catch {
            // silently fail
        }
    },
);
