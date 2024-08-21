import { DISCREET_PLACEHOLDER, redactNumericalSubstring } from '../discreetModeUtils';

describe('redactNumericalSubstring', () => {
    it('replaces sole stringified number with placeholder', () => {
        expect(redactNumericalSubstring('123')).toBe(DISCREET_PLACEHOLDER);
        expect(redactNumericalSubstring('0.001234')).toBe(DISCREET_PLACEHOLDER);
        expect(redactNumericalSubstring('-9,876,543.210001')).toBe(DISCREET_PLACEHOLDER);
        expect(redactNumericalSubstring('-.1')).toBe(DISCREET_PLACEHOLDER);
    });

    it('redacts only the number, not an accompanying symboll', () => {
        expect(redactNumericalSubstring('CZK 123')).toBe(`CZK ${DISCREET_PLACEHOLDER}`);
        expect(redactNumericalSubstring('0.001234 BTC')).toBe(`${DISCREET_PLACEHOLDER} BTC`);
        expect(redactNumericalSubstring('-9,876,543.210001€')).toBe(`${DISCREET_PLACEHOLDER}€`);
    });

    it('does not replace non-numerical strings', () => {
        expect(redactNumericalSubstring('foo')).toBe('foo');
        expect(redactNumericalSubstring('. , -.')).toBe('. , -.');
    });
});
