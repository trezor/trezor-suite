import { usSubdivisions } from '@suite-common/geolocation';

import {
    getCountrySubdivisionByCode,
    getCountrySubdivisions,
    hasCountrySubdivisions,
    isCountryCode,
    isCountrySubdivisionEmpty,
    isCountrySubdivisionRequired,
    toTradingCountryCode,
} from '../countryUtils';

describe('countryUtils', () => {
    describe('isCountryCode', () => {
        it('returns true for ISO country code and cloudflare specific codes', () => {
            expect(isCountryCode('US')).toBe(true);
            expect(isCountryCode('XX')).toBe(true);
            expect(isCountryCode('T1')).toBe(true);
        });

        it('returns false for invalid country code', () => {
            expect(isCountryCode('INVALID')).toBe(false);
        });
    });

    describe('toTradingCountryCode', () => {
        it('returns known country code', () => {
            expect(toTradingCountryCode('US')).toBe('US');
        });

        it('returns worldwide region country code', () => {
            expect(toTradingCountryCode('XX')).toBe('XX');
            expect(toTradingCountryCode('T1')).toBe('T1');
        });

        it('returns unknown fallback for invalid value', () => {
            expect(toTradingCountryCode('INVALID')).toBe('unknown');
            expect(toTradingCountryCode(undefined)).toBe('unknown');
            expect(toTradingCountryCode(123)).toBe('unknown');
        });
    });

    describe('hasCountrySubdivisions', () => {
        it('returns true only for countries with subdivisions', () => {
            expect(hasCountrySubdivisions('US')).toBe(true);
            expect(hasCountrySubdivisions('DE')).toBe(false);
        });
    });

    describe('isCountrySubdivisionRequired', () => {
        it('returns true only when country has subdivisions', () => {
            expect(isCountrySubdivisionRequired('US')).toBe(true);
            expect(isCountrySubdivisionRequired('DE')).toBe(false);
            expect(isCountrySubdivisionRequired('XX')).toBe(false);
            expect(isCountrySubdivisionRequired(undefined)).toBe(false);
        });
    });

    describe('isCountrySubdivisionEmpty', () => {
        it('returns true only when subdivision is required and missing', () => {
            expect(isCountrySubdivisionEmpty('US')).toBe(true);
            expect(isCountrySubdivisionEmpty('US', 'CA')).toBe(false);
            expect(isCountrySubdivisionEmpty('DE')).toBe(false);
        });
    });

    describe('getCountrySubdivisions', () => {
        it('returns subdivisions for countries that support them', () => {
            expect(getCountrySubdivisions('US')).toEqual(usSubdivisions);
        });

        it('returns undefined for countries without subdivisions', () => {
            expect(getCountrySubdivisions('DE')).toBeUndefined();
        });
    });

    describe('getCountrySubdivisionByCode', () => {
        it('returns subdivision when country with subdivisions is provided', () => {
            expect(getCountrySubdivisionByCode('CA', 'US')).toEqual({
                code: 'CA',
                name: 'California',
            });
        });

        it('returns undefined for unknown subdivision in selected country', () => {
            expect(getCountrySubdivisionByCode('ZZ', 'US')).toBeUndefined();
        });

        it('falls back to global search when country has no subdivisions', () => {
            expect(getCountrySubdivisionByCode('TX', 'DE')).toEqual({
                code: 'TX',
                name: 'Texas',
            });
        });

        it('searches globally when country is not provided', () => {
            expect(getCountrySubdivisionByCode('NY')).toEqual({
                code: 'NY',
                name: 'New York',
            });
            expect(getCountrySubdivisionByCode('ZZ')).toBeUndefined();
        });
    });
});
