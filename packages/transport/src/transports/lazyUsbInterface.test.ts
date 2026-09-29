import type { UsbInterfaceApi } from '@trezor/transport-common';

import { LazyUsbInterface } from './lazyUsbInterface';

const createInstance = (): UsbInterfaceApi => ({
    getDevices: jest.fn(() => Promise.resolve([])),
    onconnect: null,
    ondisconnect: null,
});

describe('LazyUsbInterface', () => {
    it('loads the instance once, on the first getDevices()', async () => {
        const instance = createInstance();
        const load = jest.fn(() => Promise.resolve(instance));
        const usb = new LazyUsbInterface(load);
        expect(load).not.toHaveBeenCalled();

        await usb.getDevices();
        await usb.getDevices();

        expect(load).toHaveBeenCalledTimes(1);
        expect(instance.getDevices).toHaveBeenCalledTimes(2);
    });

    it('hands listeners registered before the load over to the loaded instance', async () => {
        const instance = createInstance();
        const load = jest.fn(() => Promise.resolve(instance));
        const usb = new LazyUsbInterface(load);

        const onconnect = () => {};
        usb.onconnect = onconnect;
        // registering a listener must start the load, otherwise hotplug events between listen()
        // and the first enumerate would be lost
        expect(load).toHaveBeenCalledTimes(1);

        await usb.getDevices();
        expect(instance.onconnect).toBe(onconnect);
        expect(instance.ondisconnect).toBeNull();
    });

    it('clearing listeners on a never-used interface does not load the addon', () => {
        const load = jest.fn(() => Promise.resolve(createInstance()));
        const usb = new LazyUsbInterface(load);

        usb.onconnect = null;
        usb.ondisconnect = null;

        expect(load).not.toHaveBeenCalled();
    });

    it('surfaces a failed load from getDevices() and retries on the next call', async () => {
        const instance = createInstance();
        const load = jest
            .fn<Promise<UsbInterfaceApi>, []>()
            .mockRejectedValueOnce(new Error('dlopen failed'))
            .mockResolvedValue(instance);
        const usb = new LazyUsbInterface(load);

        await expect(usb.getDevices()).rejects.toThrow('dlopen failed');
        await expect(usb.getDevices()).resolves.toEqual([]);
        expect(load).toHaveBeenCalledTimes(2);
    });
});
