import { type CountryCode } from '@suite-common/geolocation';
import { type Feature } from '@suite-common/suite-types';

import { isKnownCountryCode } from './isKnownCountryCode';

export const getFinpromRestrictedCountries = (feature: Feature | undefined): CountryCode[] => {
    const payloadCountries = feature?.payload?.countries;

    if (!Array.isArray(payloadCountries)) {
        return [];
    }

    return payloadCountries
        .filter((code): code is string => typeof code === 'string')
        .map(code => code.toUpperCase())
        .filter(isKnownCountryCode);
};
