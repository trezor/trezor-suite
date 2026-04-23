import { getCountryFlag } from '../utils';

describe('getCountryFlag', () => {
    it('should return provided flag for valid country code', () => {
        expect(getCountryFlag('CZ')).toBe('CZ');
    });

    it('should return UNKNOWN for supported fallback values', () => {
        expect(getCountryFlag('unknown')).toBe('UNKNOWN');
        expect(getCountryFlag('XX')).toBe('UNKNOWN');
        expect(getCountryFlag('T1')).toBe('UNKNOWN');
    });

    it('should return undefined for unsupported values', () => {
        expect(getCountryFlag('cz')).toBeUndefined();
        expect(getCountryFlag('BTC')).toBeUndefined();
    });
});
