import { timeZoneCountries } from './timeZoneCountries';

export const getTimeZoneCountry = (timeZone: string | null) =>
    timeZone !== null && Object.hasOwn(timeZoneCountries, timeZone)
        ? timeZoneCountries[timeZone]
        : undefined;
