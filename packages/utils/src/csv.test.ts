import { sanitizeCsvValue } from './csv';

describe(sanitizeCsvValue.name, () => {
    test.each([
        ['simplevalue', 'simplevalue'],
        ['value,with,commas', '"value,with,commas"'],
        ['value"with"quotes', '"value""with""quotes"'],
        ['commas,"and",quotes', '"commas,""and"",quotes"'],
        ['a,"b","c",d', '"a,""b"",""c"",d"'],
        ['line\nbreak', '"line\nbreak"'],
        ['carriage\rreturn', '"carriage\rreturn"'],
        ['=formula', "'=formula"],
        ['+formula', "'+formula"],
        ['-formula', "'-formula"],
        ['@formula', "'@formula"],
        ['@SUM(1)', "'@SUM(1)"],
        ['\t=formula', "'\t=formula"],
        [' =formula', "' =formula"],
        ['\r=formula', '"\'\r=formula"'],
        ['=formula,with,commas', '"\'=formula,with,commas"'],
        ['text=formula', 'text=formula'],
    ])('sanitizes "%s" to "%s"', (input, expected) => {
        expect(sanitizeCsvValue(input)).toBe(expected);
    });
});
