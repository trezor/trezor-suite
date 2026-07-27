import { countBytesInString } from './countBytesInString';

it('countBytesInString', () => {
    expect(countBytesInString('aaa')).toBe(3);
    expect(countBytesInString('č')).toBe(2);
    expect(countBytesInString('😀')).toBe(4);
    expect(countBytesInString('+ěčřěžšýžřšý')).toBe(23);
});
