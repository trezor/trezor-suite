import { type CountryCode, countries } from '@suite-common/geolocation';

export const isKnownCountryCode = (code: string): code is CountryCode =>
    Object.hasOwn(countries, code);
