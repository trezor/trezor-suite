import { type GeolocationState } from './geolocationReducer';

export type GeolocationRootState = {
    geolocation: GeolocationState;
};

export const selectCountryCode = (state: GeolocationRootState) => state.geolocation.countryCode;

export const selectCountryCodeFetch = (state: GeolocationRootState) =>
    state.geolocation.countryCodeFetch;

export const selectDevicePresenceSignals = (state: GeolocationRootState) =>
    state.geolocation.deviceSignals;

export const selectPresenceIpCountry = (state: GeolocationRootState) =>
    state.geolocation.countryCodeFetch?.status === 'success' ? state.geolocation.countryCode : null;
