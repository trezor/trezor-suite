import {
    CountryCode,
    CountryCodeWithSubdivisions,
    CountrySubdivision,
    countries,
    subdivisionsByCountry,
} from '../countries';

export const isCountryCode = (countryCode: string): countryCode is CountryCode =>
    countryCode in countries || countryCode === 'XX' || countryCode === 'T1';

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
    countryCode?: CountryCode,
): CountrySubdivision | undefined => {
    if (countryCode && hasCountrySubdivisions(countryCode)) {
        return subdivisionsByCountry[countryCode].find(s => s.code === subdivisionCode);
    }

    for (const subdivisions of Object.values(subdivisionsByCountry)) {
        const match = subdivisions.find(s => s.code === subdivisionCode);
        if (match) return match;
    }

    return undefined;
};
