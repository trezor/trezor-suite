import { type CountryCode } from '../src/countries';
import { type GeolocationState, geolocationInitialState } from '../src/geolocationReducer';

export const mockGeolocationStateInCountry = (country: CountryCode): GeolocationState => ({
    ...geolocationInitialState,
    countryCode: country,
    countryCodeFetch: { status: 'success', timestamp: 0 },
    deviceSignals: { timeZone: null, primaryRegion: country, secondaryRegions: [] },
});
