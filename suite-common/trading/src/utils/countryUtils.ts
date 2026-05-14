import {
    type CountryCode,
    type CountryCodeWithSubdivisions,
    type CountrySubdivision,
    countries,
    subdivisionsByCountry,
} from '@suite-common/geolocation';

import { regional } from '../regional';
import { type TradingCountryCode } from '../types';

export const isCountryCode = (countryCode: string): countryCode is CountryCode =>
    countryCode in countries || countryCode === 'XX' || countryCode === 'T1';

export const toTradingCountryCode = (countryCode: unknown): TradingCountryCode => {
    if (countryCode === regional.UNKNOWN_COUNTRY) {
        return countryCode;
    }

    if (typeof countryCode === 'string' && isCountryCode(countryCode)) {
        return countryCode;
    }

    return regional.UNKNOWN_COUNTRY;
};

export const hasCountrySubdivisions = (
    countryCode: CountryCode,
): countryCode is CountryCodeWithSubdivisions => countryCode in subdivisionsByCountry;

export const isCountrySubdivisionRequired = (countryCode?: string) =>
    !!countryCode && isCountryCode(countryCode) && hasCountrySubdivisions(countryCode);

export const isCountrySubdivisionEmpty = (countryCode?: string, subdivisionCode?: string) =>
    isCountrySubdivisionRequired(countryCode) && !subdivisionCode;

export const getCountrySubdivisions = (
    countryCode: CountryCode,
): ReadonlyArray<CountrySubdivision> | undefined =>
    hasCountrySubdivisions(countryCode) ? subdivisionsByCountry[countryCode] : undefined;

export const getCountrySubdivisionByCode = (
    subdivisionCode: string,
    countryCode?: string,
): CountrySubdivision | undefined => {
    if (countryCode && isCountryCode(countryCode)) {
        if (hasCountrySubdivisions(countryCode)) {
            return subdivisionsByCountry[countryCode].find(s => s.code === subdivisionCode);
        }

        return undefined;
    }

    for (const subdivisions of Object.values(subdivisionsByCountry)) {
        const match = subdivisions.find(s => s.code === subdivisionCode);
        if (match) return match;
    }

    return undefined;
};
