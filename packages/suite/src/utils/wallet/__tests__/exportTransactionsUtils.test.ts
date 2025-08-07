import { sanitizeCsvValue } from '../exportTransactionsUtils';

describe(sanitizeCsvValue.name, () => {
    test.each([
        ['simplevalue', 'simplevalue'],
        ['value,with,commas', '"value,with,commas"'],
        ['value"with"quotes', 'value"with"quotes'],
        ['commas,"and",quotes', '"commas,""and"",quotes"'],
        ['a,"b","c",d', '"a,""b"",""c"",d"'],
    ])('sanitizes "%s" to "%s"', (input, expected) => {
        expect(sanitizeCsvValue(input)).toBe(expected);
    });
});
