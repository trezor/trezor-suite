import { GeolocationState } from './geolocationReducer';

type GeolocationRootState = {
    geolocation: GeolocationState;
};

export const selectCountryCode = (state: GeolocationRootState) => state.geolocation.countryCode;
