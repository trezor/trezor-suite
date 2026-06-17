import { hexToRgba } from '../src/hexToRgba';

describe('hexToRgba', () => {
    it('converts 6-digit hex to rgb', () => {
        expect(hexToRgba('#E6E8EB')).toBe('rgb(230, 232, 235)');
    });

    it('converts 8-digit hex with embedded alpha to rgba', () => {
        expect(hexToRgba('#F8B55D5E')).toBe('rgba(248, 181, 93, 0.37)');
    });

    it('uses explicit alpha over embedded alpha', () => {
        expect(hexToRgba('#F8B55D5E', 0.5)).toBe('rgba(248, 181, 93, 0.5)');
    });

    it('converts 8-digit brand soft token hex to rgba', () => {
        expect(hexToRgba('#60E1984D')).toBe('rgba(96, 225, 152, 0.3)');
    });
});
