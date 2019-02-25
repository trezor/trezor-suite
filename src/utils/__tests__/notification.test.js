import * as utils from 'utils/notification';

describe('notification utils', () => {
    it('get colors from status', () => {
        expect(utils.getPrimaryColor('info')).toBe('#1E7FF0');
        expect(utils.getPrimaryColor('warning')).toBe('#EB8A00');
        expect(utils.getPrimaryColor('error')).toBe('#ED1212');
        expect(utils.getPrimaryColor('success')).toBe('#01B757');
        expect(utils.getPrimaryColor('kdsjflds')).toBe(null);
        expect(utils.getPrimaryColor('')).toBe(null);
    });
});
