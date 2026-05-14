import { normalizeForSearch } from '../listFilterUtils';

describe('normalizeForSearch', () => {
    it.each([
        ['Hello World', 'hello world'], // Basic casing
        ['  Trim Me  ', 'trim me'], // Whitespace handling
        ['Crème Brûlée', 'creme brulee'], // Accents/Diacritics
        ['München', 'munchen'], // Umlauts
        ['ñandú', 'nandu'], // Tildes
        ['   Pikachu   ', 'pikachu'], // Combined trim + case
        ['123-ABC', '123-abc'], // Numbers and symbols (remain)
        ['', ''], // Empty string
        ['!@#$%^&*()', '!@#$%^&*()'], // Special characters
        ['STRANGE CASE', 'strange case'], // All caps
    ])('should transform "%s" into "%s"', (input, expected) => {
        expect(normalizeForSearch(input)).toBe(expected);
    });
});
