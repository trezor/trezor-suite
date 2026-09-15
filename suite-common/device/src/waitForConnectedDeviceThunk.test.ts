import { type AcquiredDevice } from '@suite-common/suite-types';
import { createTestStore } from '@suite-common/test-utils';

import { deviceInitialState } from './deviceReducer';
import { createDeviceReceiver } from './services/createDeviceReceiver';
import { waitForConnectedDeviceThunk } from './waitForConnectedDeviceThunk';

const createDevice = (overrides: Partial<AcquiredDevice> = {}) =>
    ({
        path: '1' as AcquiredDevice['path'],
        connected: true,
        features: {},
        descriptor: { apiType: 'usb' },
        ...overrides,
    }) as AcquiredDevice;

const createStore = (devices: AcquiredDevice[]) => {
    const deviceReceiver = createDeviceReceiver();
    const store = createTestStore({
        extra: { services: { deviceReceiver } },
        preloadedState: { device: { ...deviceInitialState, devices } },
    });

    return { store, deviceReceiver };
};

describe('waitForConnectedDeviceThunk', () => {
    it('resolves at once with a device the store already holds', async () => {
        const device = createDevice();
        const { store } = createStore([device]);

        await expect(
            store.dispatch(waitForConnectedDeviceThunk({ apiType: 'usb' })).unwrap(),
        ).resolves.toBe(device);
    });

    // The race this exists for: `@trezor/connect` returns from a firmware update before the
    // connect event has put the device in the store.
    it('waits for a device that is not in the store yet', async () => {
        const { store, deviceReceiver } = createStore([]);

        const pending = store.dispatch(waitForConnectedDeviceThunk({ apiType: 'usb' })).unwrap();

        const device = createDevice();
        deviceReceiver.notifyDeviceConnected(device);

        await expect(pending).resolves.toBe(device);
    });

    it('keeps waiting while a second device makes the answer ambiguous', async () => {
        const { store } = createStore([
            createDevice(),
            createDevice({ path: '2' as AcquiredDevice['path'] }),
        ]);

        await expect(
            store.dispatch(waitForConnectedDeviceThunk({ apiType: 'usb', timeoutMs: 1 })).unwrap(),
        ).resolves.toBeUndefined();
    });

    it('ignores a device on another transport', async () => {
        const { store } = createStore([
            createDevice({ descriptor: { apiType: 'bluetooth' } as never }),
        ]);

        await expect(
            store.dispatch(waitForConnectedDeviceThunk({ apiType: 'usb', timeoutMs: 1 })).unwrap(),
        ).resolves.toBeUndefined();
    });

    it('resolves undefined for a device that never comes back', async () => {
        const { store } = createStore([]);

        await expect(
            store.dispatch(waitForConnectedDeviceThunk({ apiType: 'usb', timeoutMs: 1 })).unwrap(),
        ).resolves.toBeUndefined();
    });
});
