import { type GeolocationState } from './geolocationReducer';

export type GeolocationRootState = {
    geolocation: GeolocationState;
};

export const selectCountryCode = (state: GeolocationRootState) => state.geolocation.countryCode;
