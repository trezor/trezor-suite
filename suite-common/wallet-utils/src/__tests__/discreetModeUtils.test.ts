import { redactNumericalSubstring } from '../discreetModeUtils';

const MAX_PLACEHOLDER = '####'; // placeholder with maximal length of 4 characters

describe('redactNumericalSubstring', () => {
    it('replaces sole stringified number with placeholder', () => {
        expect(redactNumericalSubstring('123')).toBe('###');
        expect(redactNumericalSubstring('0.001234')).toBe(MAX_PLACEHOLDER);
        expect(redactNumericalSubstring('-9,876,543.210001')).toBe(MAX_PLACEHOLDER);
        expect(redactNumericalSubstring('-.1')).toBe('###');
    });

    it('redacts only the number, not an accompanying symboll', () => {
        expect(redactNumericalSubstring('CZK 123')).toBe(`CZK ###`);
        expect(redactNumericalSubstring('0.001234 BTC')).toBe(`${MAX_PLACEHOLDER} BTC`);
        expect(redactNumericalSubstring('-9,876,543.210001€')).toBe(`${MAX_PLACEHOLDER}€`);
    });

    it('redacts all number occurrences', () => {
        expect(redactNumericalSubstring('CZK 123 is 12345 satoshi')).toBe(
            `CZK ### is ${MAX_PLACEHOLDER} satoshi`,
        );
    });

    it('does not replace non-numerical strings', () => {
        expect(redactNumericalSubstring('foo')).toBe('foo');
        expect(redactNumericalSubstring('. , -.')).toBe('. , -.');
    });
});
