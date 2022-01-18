import { hasUppercaseLetter } from '../src/hasUppercaseLetter';

describe('hasUppercaseLetter', () => {
    it('hasUppercaseLetter', () => {
        expect(hasUppercaseLetter('0')).toBe(false);
        expect(hasUppercaseLetter('abc')).toBe(false);
        expect(hasUppercaseLetter('abcD')).toBe(true);
        expect(hasUppercaseLetter('Abcd')).toBe(true);
        expect(hasUppercaseLetter('aBcd')).toBe(true);
        expect(hasUppercaseLetter('123abc123')).toBe(false);
        expect(hasUppercaseLetter('0x123abc456')).toBe(false);
        expect(hasUppercaseLetter('0x123aBc456')).toBe(true);
    });
});
