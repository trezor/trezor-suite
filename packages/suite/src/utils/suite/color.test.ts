import { lightenHexColor } from './color';

describe(lightenHexColor.name, () => {
    it.each([
        ['#1C1E20', 0.02, '#212325'],
        ['#FFFFFF', 0.02, '#ffffff'],
        ['#000000', 0.02, '#050505'],
        ['#7F7F7F', 0.1, '#999999'],
        ['#00854D', 0.02, '#008f53'],
        ['#00854D', 0.1, '#00b86b'],
        ['#E8F5EF', 0.02, '#eff8f4'],
        ['#E8F5EF', 0.1, '#ffffff'],
        ['#CD4949', 0.1, '#d87171'],
        ['#0F6148', 0.1, '#168d69'],
        ['#000acc', 0.02, '#000bd6'],
    ])('lightens %s by %d to %s', (hexColor, amount, expected) => {
        expect(lightenHexColor(amount, hexColor)).toBe(expected);
    });

    it.each(['transparent', '#fff', '#FFFFFF80', 'rgb(0, 0, 0)'])('returns %s unchanged', color => {
        expect(lightenHexColor(0.02, color)).toBe(color);
    });
});
