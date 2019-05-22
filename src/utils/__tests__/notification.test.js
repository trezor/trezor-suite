import * as utils from 'utils/notification';
import { colors, icons } from 'trezor-ui-components';

describe('notification utils', () => {
    it('get primary color from status', () => {
        expect(utils.getPrimaryColor('info')).toBe(colors.INFO_PRIMARY);
        expect(utils.getPrimaryColor('warning')).toBe(colors.WARNING_PRIMARY);
        expect(utils.getPrimaryColor('error')).toBe(colors.ERROR_PRIMARY);
        expect(utils.getPrimaryColor('success')).toBe(colors.SUCCESS_PRIMARY);
        expect(utils.getPrimaryColor('kdsjflds')).toBe(null);
        expect(utils.getPrimaryColor('')).toBe(null);
    });

    it('get notification bg color from status', () => {
        expect(utils.getNotificationBgColor('info')).toBe(colors.INFO_LIGHT);
        expect(utils.getNotificationBgColor('warning')).toBe(colors.WARNING_LIGHT);
        expect(utils.getNotificationBgColor('error')).toBe(colors.ERROR_LIGHT);
        expect(utils.getNotificationBgColor('success')).toBe(colors.SUCCESS_LIGHT);
        expect(utils.getNotificationBgColor('kdsjflds')).toBe(null);
        expect(utils.getNotificationBgColor('')).toBe(null);
    });

    it('get icon according to status', () => {
        expect(utils.getIcon('info')).toEqual(icons.INFO);
        expect(utils.getIcon('error')).toEqual(icons.ERROR);
        expect(utils.getIcon('success')).toEqual(icons.SUCCESS);
        expect(utils.getIcon('warning')).toEqual(icons.WARNING);
    });
});
