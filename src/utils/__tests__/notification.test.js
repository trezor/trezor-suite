import * as utils from 'utils/notification';
import colors from 'config/colors';
import icons from 'config/icons';

describe('notification utils', () => {
    it('get primary color from status', () => {
        expect(utils.getPrimaryColor('info')).toBe(colors.INFO_PRIMARY);
        expect(utils.getPrimaryColor('warning')).toBe(colors.WARNING_PRIMARY);
        expect(utils.getPrimaryColor('error')).toBe(colors.ERROR_PRIMARY);
        expect(utils.getPrimaryColor('success')).toBe(colors.SUCCESS_PRIMARY);
        expect(utils.getPrimaryColor('kdsjflds')).toBe(null);
        expect(utils.getPrimaryColor('')).toBe(null);
    });

    it('get secondary color from status', () => {
        expect(utils.getSecondaryColor('info')).toBe(colors.INFO_SECONDARY);
        expect(utils.getSecondaryColor('warning')).toBe(colors.WARNING_SECONDARY);
        expect(utils.getSecondaryColor('error')).toBe(colors.ERROR_SECONDARY);
        expect(utils.getSecondaryColor('success')).toBe(colors.SUCCESS_SECONDARY);
        expect(utils.getSecondaryColor('kdsjflds')).toBe(null);
        expect(utils.getSecondaryColor('')).toBe(null);
    });

    it('get icon according to status', () => {
        expect(utils.getIcon('info')).toEqual(icons.INFO);
        expect(utils.getIcon('error')).toEqual(icons.ERROR);
        expect(utils.getIcon('success')).toEqual(icons.SUCCESS);
        expect(utils.getIcon('warning')).toEqual(icons.WARNING);
    });
});
