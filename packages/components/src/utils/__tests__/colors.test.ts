import colors from '../../config/colors';
import { getPrimaryColor, getSecondaryColor, getNotificationBgColor } from '../colors';

test('Colors', () => {
    expect(getPrimaryColor('info')).toBe(colors.INFO_PRIMARY);
    expect(getPrimaryColor('warning')).toBe(colors.WARNING_PRIMARY);
    expect(getPrimaryColor('success')).toBe(colors.SUCCESS_PRIMARY);
    expect(getPrimaryColor('error')).toBe(colors.ERROR_PRIMARY);
    expect(getPrimaryColor('white')).toBe(colors.WHITE);
    expect(getPrimaryColor()).toBe(null);

    expect(getSecondaryColor('info')).toBe(colors.INFO_SECONDARY);
    expect(getSecondaryColor('warning')).toBe(colors.WARNING_SECONDARY);
    expect(getSecondaryColor('success')).toBe(colors.SUCCESS_SECONDARY);
    expect(getSecondaryColor('error')).toBe(colors.ERROR_SECONDARY);
    expect(getSecondaryColor('white')).toBe(colors.WHITE);
    expect(getSecondaryColor()).toBe(null);

    expect(getNotificationBgColor('info')).toBe(colors.INFO_LIGHT);
    expect(getNotificationBgColor('warning')).toBe(colors.WARNING_LIGHT);
    expect(getNotificationBgColor('success')).toBe(colors.SUCCESS_LIGHT);
    expect(getNotificationBgColor('error')).toBe(colors.ERROR_LIGHT);
    expect(getNotificationBgColor()).toBe(null);
});
