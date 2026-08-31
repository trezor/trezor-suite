import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';

import { getShouldSelectConnectedDevice } from './getShouldSelectConnectedDevice';

type Descriptor = TrezorDevice['descriptor'];

// `descriptor.id` is what identifies a physical device across reconnects, so it is set explicitly
// here - it is the only thing tying the bootloader instance below back to `DEVICE_A`.
const descriptorA: Descriptor = { apiType: 'usb', id: 'descriptor-a' };
const descriptorB: Descriptor = { apiType: 'usb', id: 'descriptor-b' };
// USB reports zeroes where the serial number goes while the device runs the bootloader, so this is
// what the device being updated actually looks like before it restarts.
const descriptorBootloader: Descriptor = { apiType: 'usb', id: '000000000000000000000000' };

const withDescriptor = (device: TrezorDevice, descriptor: Descriptor): TrezorDevice => ({
    ...device,
    descriptor,
});

const DEVICE_A = withDescriptor(
    mockSuiteDevice({ path: '1', connected: true }, { device_id: 'device-a' }),
    descriptorA,
);
const DEVICE_A_REMEMBERED = withDescriptor(
    mockSuiteDevice({ path: '', connected: false, remember: true }, { device_id: 'device-a' }),
    descriptorA,
);
// Reconnecting in bootloader mode, so without an `id`, on a path assigned by the new connection.
const DEVICE_A_BOOTLOADER = withDescriptor(
    mockSuiteDevice({ path: '3', type: 'unacquired', connected: true }),
    descriptorA,
);
const DEVICE_B = withDescriptor(
    mockSuiteDevice({ path: '2', connected: true }, { device_id: 'device-b' }),
    descriptorB,
);
const DEVICE_B_UNACQUIRED = withDescriptor(
    mockSuiteDevice({ path: '2', type: 'unacquired', connected: true }),
    descriptorB,
);

const NO_FIRMWARE_UPDATE = { status: 'initial' } as const;

describe('getShouldSelectConnectedDevice', () => {
    it('selects nothing when no device is being connected', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: undefined,
                selectedDevice: DEVICE_A,
                physicalDeviceWallets: [DEVICE_A],
                firmware: NO_FIRMWARE_UPDATE,
            }),
        ).toEqual({ shouldSelect: false, reason: 'no-connected-device' });
    });

    it('selects the first device when no wallet is selected yet', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_A,
                selectedDevice: undefined,
                physicalDeviceWallets: [DEVICE_A],
                firmware: NO_FIRMWARE_UPDATE,
            }),
        ).toEqual({ shouldSelect: true, reason: 'no-selected-device' });
    });

    it('selects the device of the selected remembered wallet when it connects', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_A,
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [DEVICE_A_REMEMBERED],
                firmware: NO_FIRMWARE_UPDATE,
            }),
        ).toEqual({ shouldSelect: true, reason: 'same-device' });
    });

    it('keeps the selection when the selected wallet already has its device connected', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_B,
                selectedDevice: DEVICE_A,
                physicalDeviceWallets: [DEVICE_A, DEVICE_B],
                firmware: NO_FIRMWARE_UPDATE,
            }),
        ).toEqual({ shouldSelect: false, reason: 'selected-device-connected' });
    });

    it('selects a connected device when the selected wallet has no device present', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_B,
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [DEVICE_A_REMEMBERED, DEVICE_B],
                firmware: NO_FIRMWARE_UPDATE,
            }),
        ).toEqual({ shouldSelect: true, reason: 'only-connected-device' });
    });

    it('selects an unacquired device, which is how a device pairing over THP shows up first', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_B_UNACQUIRED,
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [DEVICE_A_REMEMBERED, DEVICE_B_UNACQUIRED],
                firmware: NO_FIRMWARE_UPDATE,
            }),
        ).toEqual({ shouldSelect: true, reason: 'only-connected-device' });
    });

    it('keeps the selection when another device is connected too, as the intent is ambiguous', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_B,
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [DEVICE_A_REMEMBERED, DEVICE_A, DEVICE_B],
                firmware: NO_FIRMWARE_UPDATE,
            }),
        ).toEqual({ shouldSelect: false, reason: 'other-device-connected' });
    });

    it('does not count two wallets of one connected device as two devices', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_B,
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [
                    DEVICE_A_REMEMBERED,
                    DEVICE_B,
                    { ...DEVICE_B, instance: 2 } as TrezorDevice,
                ],
                firmware: NO_FIRMWARE_UPDATE,
            }),
        ).toEqual({ shouldSelect: true, reason: 'only-connected-device' });
    });

    it('does not take two unacquired devices for one just because neither has an id', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_B_UNACQUIRED,
                selectedDevice: DEVICE_A_BOOTLOADER,
                physicalDeviceWallets: [DEVICE_A_BOOTLOADER, DEVICE_B_UNACQUIRED],
                firmware: NO_FIRMWARE_UPDATE,
            }),
        ).toEqual({ shouldSelect: false, reason: 'selected-device-connected' });
    });

    // A device in bootloader mode reports `id: null` rather than omitting it.
    it('does not take two devices in bootloader mode for one just because both report a null id', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: { ...DEVICE_B, id: null } as TrezorDevice,
                selectedDevice: { ...DEVICE_A_REMEMBERED, id: null } as TrezorDevice,
                physicalDeviceWallets: [{ ...DEVICE_A_REMEMBERED, id: null } as TrezorDevice],
                firmware: NO_FIRMWARE_UPDATE,
            }),
        ).toEqual({ shouldSelect: true, reason: 'only-connected-device' });
    });
});

// The device being updated disconnects and reconnects repeatedly, in bootloader mode and without
// its `id`, so every state of the flow has to keep an unrelated device from being taken for it,
// not only the installation itself.
describe('getShouldSelectConnectedDevice during a firmware update', () => {
    it('does not select an unrelated device while the installation is running', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_B_UNACQUIRED,
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [DEVICE_A_REMEMBERED, DEVICE_B_UNACQUIRED],
                firmware: { status: 'started', cachedDevice: DEVICE_A },
            }),
        ).toEqual({ shouldSelect: false, reason: 'other-device-firmware-update' });
    });

    it('does not select an unrelated device while the updated device pairs over THP', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_B_UNACQUIRED,
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [DEVICE_A_REMEMBERED, DEVICE_B_UNACQUIRED],
                firmware: { status: 'thp-pairing', cachedDevice: DEVICE_A },
            }),
        ).toEqual({ shouldSelect: false, reason: 'other-device-firmware-update' });
    });

    it('does not select an unrelated device while the seed backup is being confirmed', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_B_UNACQUIRED,
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [DEVICE_A_REMEMBERED, DEVICE_B_UNACQUIRED],
                firmware: { status: 'check-seed', cachedDevice: DEVICE_A },
            }),
        ).toEqual({ shouldSelect: false, reason: 'other-device-firmware-update' });
    });

    // `done` is set the moment Connect resolves, while the device still reboots to normal mode.
    it('does not select an unrelated device after the update is done', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_B_UNACQUIRED,
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [DEVICE_A_REMEMBERED, DEVICE_B_UNACQUIRED],
                firmware: { status: 'done', cachedDevice: DEVICE_A },
            }),
        ).toEqual({ shouldSelect: false, reason: 'other-device-firmware-update' });
    });

    // A half-updated device is the one most likely to reconnect erratically.
    it('does not select an unrelated device after the update failed', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_B_UNACQUIRED,
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [DEVICE_A_REMEMBERED, DEVICE_B_UNACQUIRED],
                firmware: { status: 'error', cachedDevice: DEVICE_A },
            }),
        ).toEqual({ shouldSelect: false, reason: 'other-device-firmware-update' });
    });

    // The device is updated straight from bootloader mode, so the cached device has neither its `id`
    // nor a real `descriptor.id`, and comes back with both. Regression guard: matching those against
    // each other fails, which used to leave the updated device unselectable.
    it('selects the updated device that was cached in bootloader mode', () => {
        const cachedBootloaderDevice = withDescriptor(
            mockSuiteDevice({ path: '3', type: 'unacquired', connected: false }),
            descriptorBootloader,
        );

        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_A,
                selectedDevice: undefined,
                physicalDeviceWallets: [DEVICE_A],
                firmware: { status: 'done', cachedDevice: cachedBootloaderDevice },
            }),
        ).toEqual({ shouldSelect: true, reason: 'no-selected-device' });
    });

    // Zeroes are not an identity, so a device reporting them is not the device being updated even
    // when that device is known.
    it('does not take a device reporting zeroes for the identified device being updated', () => {
        const otherBootloaderDevice = withDescriptor(
            mockSuiteDevice({ path: '4', type: 'unacquired', connected: true }),
            descriptorBootloader,
        );

        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: otherBootloaderDevice,
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [DEVICE_A_REMEMBERED],
                firmware: { status: 'started', cachedDevice: DEVICE_A },
            }),
        ).toEqual({ shouldSelect: false, reason: 'other-device-firmware-update' });
    });

    it('does not select an unrelated device when no device was cached', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_B_UNACQUIRED,
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [DEVICE_A_REMEMBERED, DEVICE_B_UNACQUIRED],
                firmware: { status: 'started' },
            }),
        ).toEqual({ shouldSelect: false, reason: 'other-device-firmware-update' });
    });

    it('does not match two devices whose descriptor reports no id', () => {
        const noDescriptorId: Descriptor = { apiType: 'usb', id: null };

        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: withDescriptor(DEVICE_B_UNACQUIRED, noDescriptorId),
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [DEVICE_A_REMEMBERED],
                firmware: {
                    status: 'started',
                    cachedDevice: withDescriptor(DEVICE_A, noDescriptorId),
                },
            }),
        ).toEqual({ shouldSelect: false, reason: 'other-device-firmware-update' });
    });

    it('selects the updated device when it reconnects in bootloader mode without its id', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_A_BOOTLOADER,
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [DEVICE_A_REMEMBERED, DEVICE_A_BOOTLOADER],
                firmware: { status: 'started', cachedDevice: DEVICE_A },
            }),
        ).toEqual({ shouldSelect: true, reason: 'only-connected-device' });
    });

    // The updated device is removed from the list while it reboots unless it is remembered, which
    // leaves nothing selected - and an empty selection must not become a way in for another device.
    it('does not select an unrelated device while nothing is selected', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_B_UNACQUIRED,
                selectedDevice: undefined,
                physicalDeviceWallets: [DEVICE_B_UNACQUIRED],
                firmware: { status: 'done', cachedDevice: DEVICE_A },
            }),
        ).toEqual({ shouldSelect: false, reason: 'other-device-firmware-update' });
    });

    it('selects the updated device while nothing is selected', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_A,
                selectedDevice: undefined,
                physicalDeviceWallets: [DEVICE_A],
                firmware: { status: 'done', cachedDevice: DEVICE_A },
            }),
        ).toEqual({ shouldSelect: true, reason: 'no-selected-device' });
    });

    // `descriptor.id` is scoped to the transport, so a device updated over USB and reconnecting
    // over Bluetooth is recognised by its `id` instead.
    it('selects the updated device when it comes back over another transport', () => {
        const bluetoothDescriptor: Descriptor = { apiType: 'bluetooth', id: 'bluetooth-a' };

        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: withDescriptor(DEVICE_A, bluetoothDescriptor),
                selectedDevice: undefined,
                physicalDeviceWallets: [withDescriptor(DEVICE_A, bluetoothDescriptor)],
                firmware: { status: 'done', cachedDevice: DEVICE_A },
            }),
        ).toEqual({ shouldSelect: true, reason: 'no-selected-device' });
    });

    it('selects the updated device when it comes back acquired with its id', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_A,
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [DEVICE_A_REMEMBERED, DEVICE_A],
                firmware: { status: 'done', cachedDevice: DEVICE_A },
            }),
        ).toEqual({ shouldSelect: true, reason: 'same-device' });
    });
});
