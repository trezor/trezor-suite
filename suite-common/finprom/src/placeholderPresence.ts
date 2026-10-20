import { type CountryCode } from '@suite-common/geolocation';

import { isKnownCountryCode } from './isKnownCountryCode';

// TODO(#33785): Placeholder, country from the UI language region, not real presence.
// Replace with real detection.
export const getPlaceholderCountryFromLocale = (locale: string): CountryCode | null => {
    const region = locale.split('-')[1]?.toUpperCase();

    if (region === undefined || !isKnownCountryCode(region)) {
        return null;
    }

    return region;
};
