import { getStateIcon, getDeviceIcon } from '../icons';

test('Icons', () => {
    expect(getStateIcon('info')).toBe('INFO');
    expect(getStateIcon('error')).toBe('ERROR');
    expect(getStateIcon('warning')).toBe('WARNING');
    expect(getStateIcon('success')).toBe('SUCCESS');
    expect(getStateIcon()).toBe(null);
    expect(getDeviceIcon(1)).toBe('T1');
    expect(getDeviceIcon(2)).toBe('T2');
    expect(getDeviceIcon(3)).toBe('T2');
    expect(getDeviceIcon(0)).toBe('T1');
    // @ts-ignore: invalid param
    expect(getDeviceIcon(undefined)).toBe('T1');
    // @ts-ignore: invalid param
    expect(getDeviceIcon({})).toBe('T1');
});
