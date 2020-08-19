import * as stringUtils from '../string';

it('capitalizeFirstLetter', () => {
    expect(stringUtils.capitalizeFirstLetter('god')).toBe('God');
    expect(stringUtils.capitalizeFirstLetter('dog')).toBe('Dog');
});

it('countBytesInString', () => {
    expect(stringUtils.countBytesInString('aaa')).toBe(3);
    expect(stringUtils.countBytesInString('č')).toBe(2);
    expect(stringUtils.countBytesInString('😀')).toBe(4);
    expect(stringUtils.countBytesInString('+ěčřěžšýžřšý')).toBe(23);
});

it('getNumberFromPxString', () => {
    expect(stringUtils.getNumberFromPxString('1px')).toBe(1);
    expect(stringUtils.getNumberFromPxString('1')).toBe(1);
});
