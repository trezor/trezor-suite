import { asGetter } from '@suite-common/dependency-injection';

import { createDesktopRequestDeviceAccess } from './createDesktopRequestDeviceAccess';

const getIsDeviceLocked = (isDeviceLocked = false) => asGetter(() => isDeviceLocked);

describe('createDesktopRequestDeviceAccess', () => {
    it('runs the callback and returns its result', async () => {
        const requestDeviceAccess = createDesktopRequestDeviceAccess({
            getIsDeviceLocked: getIsDeviceLocked(),
        });

        const result = await requestDeviceAccess(() => Promise.resolve('features'));

        expect(result).toEqual({ success: true, payload: 'features' });
    });

    it('reports a throwing callback as a failure that was not skipped', async () => {
        const requestDeviceAccess = createDesktopRequestDeviceAccess({
            getIsDeviceLocked: getIsDeviceLocked(),
        });

        const result = await requestDeviceAccess(() => {
            throw new Error('Device call failed');
        });

        expect(result).toEqual({
            success: false,
            error: 'Device call failed',
            wasSkipped: false,
        });
    });

    it('skips a skipIfBusy request while the device is locked', async () => {
        const requestDeviceAccess = createDesktopRequestDeviceAccess({
            getIsDeviceLocked: getIsDeviceLocked(true),
        });
        const deviceCallback = jest.fn();

        const result = await requestDeviceAccess(deviceCallback, { priority: 'skipIfBusy' });

        expect(deviceCallback).not.toHaveBeenCalled();
        expect(result.success).toBe(false);
        expect(result).toHaveProperty('wasSkipped', true);
    });

    it('runs a skipIfBusy request once the device is not locked', async () => {
        const requestDeviceAccess = createDesktopRequestDeviceAccess({
            getIsDeviceLocked: getIsDeviceLocked(),
        });
        const deviceCallback = jest.fn();

        await requestDeviceAccess(deviceCallback, { priority: 'skipIfBusy' });

        expect(deviceCallback).toHaveBeenCalled();
    });

    it('runs the other priorities even while the device is locked, having no queue to wait in', async () => {
        const requestDeviceAccess = createDesktopRequestDeviceAccess({
            getIsDeviceLocked: getIsDeviceLocked(true),
        });
        const deviceCallback = jest.fn();

        await requestDeviceAccess(deviceCallback, { priority: 'default' });
        await requestDeviceAccess(deviceCallback, { priority: 'prioritized' });

        expect(deviceCallback).toHaveBeenCalledTimes(2);
    });
});
