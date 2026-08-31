import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';

import { getShouldSelectConnectedDevice } from './getShouldSelectConnectedDevice';

type Descriptor = TrezorDevice['descriptor'];

// `descriptor.id` is what identifies a physical device across reconnects, so it is set explicitly
// here - it is the only thing tying the bootloader instance below back to `DEVICE_A`.
const descriptorA: Descriptor = { apiType: 'usb', id: 'descriptor-a' };
const descriptorB: Descriptor = { apiType: 'usb', id: 'descriptor-b' };

const withDescriptor = (device: TrezorDevice, descriptor: Descriptor): TrezorDevice => ({
    ...device,
    descriptor,
});

// Every device in bootloader mode reports this as its USB serial number, so `descriptor.id` says
// nothing about which device it is.
const BOOTLOADER_DESCRIPTOR: Descriptor = { apiType: 'usb', id: '000000000000000000000000' };

const DEVICE_A = withDescriptor(
    mockSuiteDevice({ path: '1', connected: true }, { device_id: 'device-a' }),
    descriptorA,
);
const DEVICE_A_REMEMBERED = withDescriptor(
    mockSuiteDevice({ path: '', connected: false, remember: true }, { device_id: 'device-a' }),
    descriptorA,
);
// Reconnecting in bootloader mode, so without an `id`, on a path assigned by the new connection.
// Its serial number is the placeholder every device in bootloader mode reports.
const DEVICE_A_BOOTLOADER = withDescriptor(
    mockSuiteDevice({ path: '3', type: 'unacquired', connected: true }),
    BOOTLOADER_DESCRIPTOR,
);
const DEVICE_B = withDescriptor(
    mockSuiteDevice({ path: '2', connected: true }, { device_id: 'device-b' }),
    descriptorB,
);
const DEVICE_B_UNACQUIRED = withDescriptor(
    mockSuiteDevice({ path: '2', type: 'unacquired', connected: true }),
    descriptorB,
);

// A device with no firmware sits in bootloader mode from the start: no `id` of its own, and a
// `descriptor.id` shared with every other device in bootloader mode.
const DEVICE_WITHOUT_FIRMWARE = withDescriptor(
    mockSuiteDevice({ path: '1', type: 'unacquired', connected: true }),
    BOOTLOADER_DESCRIPTOR,
);
// The same device once the installation rebooted it into firmware mode, reporting both now.
const DEVICE_AFTER_FRESH_INSTALLATION = withDescriptor(
    mockSuiteDevice({ path: '4', connected: true }, { device_id: 'device-freshly-installed' }),
    { apiType: 'usb', id: 'descriptor-freshly-installed' },
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
        ).toEqual({ shouldSelect: false, reason: 'other-device-connected' });
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

    // What #30929 asked for: a Bluetooth device connecting while the selected wallet is a remembered
    // one whose device is elsewhere. The transport is nothing the rules look at, hence one case.
    it('selects a device connecting over Bluetooth when nothing else is present', () => {
        const deviceOverBluetooth = withDescriptor(DEVICE_B, {
            apiType: 'bluetooth',
            id: 'bluetooth-b',
        });

        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: deviceOverBluetooth,
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [DEVICE_A_REMEMBERED, deviceOverBluetooth],
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
        ).toEqual({ shouldSelect: false, reason: 'other-device-connected' });
    });

    // A device in bootloader mode reports `id: null` rather than omitting it.
    it('does not take two devices in bootloader mode for one just because both report a null id', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: { ...DEVICE_B, id: null } as TrezorDevice,
                selectedDevice: { ...DEVICE_A_REMEMBERED, id: null } as TrezorDevice,
                physicalDeviceWallets: [
                    { ...DEVICE_A_REMEMBERED, id: null } as TrezorDevice,
                    { ...DEVICE_B, id: null } as TrezorDevice,
                ],
                firmware: NO_FIRMWARE_UPDATE,
            }),
        ).toEqual({ shouldSelect: true, reason: 'only-connected-device' });
    });
});

// The device being updated disconnects and reconnects repeatedly, in bootloader mode and without
// its `id`, so every state of the flow has to keep an unrelated device from being taken for it,
// not only the installation itself.
describe('getShouldSelectConnectedDevice during a firmware update', () => {
    // The updated device disconnects and reconnects with nothing to recognise it by, so being the
    // only device present is what tells it apart - the same rule `onCallFirmwareUpdate` follows to
    // find the device it is updating.
    it('keeps the selection while another device is present as well', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_B_UNACQUIRED,
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [DEVICE_A, DEVICE_B_UNACQUIRED],
                firmware: { status: 'started' },
            }),
        ).toEqual({ shouldSelect: false, reason: 'other-device-firmware-update' });
    });

    it.each(['started', 'thp-pairing', 'check-seed', 'done', 'error'] as const)(
        'keeps the selection with another device present, in status %s',
        status => {
            expect(
                getShouldSelectConnectedDevice({
                    incomingDevice: DEVICE_B_UNACQUIRED,
                    selectedDevice: undefined,
                    physicalDeviceWallets: [DEVICE_A, DEVICE_B_UNACQUIRED],
                    firmware: { status },
                }),
            ).toEqual({ shouldSelect: false, reason: 'other-device-firmware-update' });
        },
    );

    // A fresh installation on a device with no firmware: it was in bootloader mode all along, so
    // nothing about it before the installation matches what comes back afterwards. The wallet keeps
    // the selection, because a wallet losing it to a device that cannot be matched by id is what the
    // onboarding reads as the user having swapped devices.
    it('leaves the selection where it is when it cannot recognise what came back', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_AFTER_FRESH_INSTALLATION,
                // The entry it connected under before the reboot, no longer present.
                selectedDevice: { ...DEVICE_WITHOUT_FIRMWARE, connected: false },
                physicalDeviceWallets: [DEVICE_AFTER_FRESH_INSTALLATION],
                firmware: { status: 'done' },
            }),
        ).toEqual({ shouldSelect: false, reason: 'other-device-firmware-update' });
    });

    it('selects the device that comes back from a fresh installation with nothing selected', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_AFTER_FRESH_INSTALLATION,
                selectedDevice: undefined,
                physicalDeviceWallets: [DEVICE_AFTER_FRESH_INSTALLATION],
                firmware: { status: 'check-seed' },
            }),
        ).toEqual({ shouldSelect: true, reason: 'no-selected-device' });
    });

    // In bootloader mode it reports no `id`, so the wallet it is being updated for keeps the
    // selection until it comes back reporting one, in the test below.
    it('leaves the selection on the wallet while its device sits in bootloader mode', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_A_BOOTLOADER,
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [DEVICE_A_REMEMBERED, DEVICE_A_BOOTLOADER],
                firmware: { status: 'started' },
            }),
        ).toEqual({ shouldSelect: false, reason: 'other-device-firmware-update' });
    });

    // What #31911 was about: the onboarding installation leaves no selection behind, so the device
    // that comes back has to be able to fill it, unrecognisable as it is.
    it('fills an empty selection with the device that comes back from a fresh installation', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_AFTER_FRESH_INSTALLATION,
                selectedDevice: undefined,
                physicalDeviceWallets: [DEVICE_AFTER_FRESH_INSTALLATION],
                firmware: { status: 'done' },
            }),
        ).toEqual({ shouldSelect: true, reason: 'no-selected-device' });
    });

    it('selects the updated device when it comes back with its id', () => {
        expect(
            getShouldSelectConnectedDevice({
                incomingDevice: DEVICE_A,
                selectedDevice: DEVICE_A_REMEMBERED,
                physicalDeviceWallets: [DEVICE_A_REMEMBERED, DEVICE_A],
                firmware: { status: 'done' },
            }),
        ).toEqual({ shouldSelect: true, reason: 'same-device' });
    });

    // What the update actually suspends: an empty selection, which the updated device leaves behind
    // while it reboots, is not a way in for another device until the flow is closed and the status
    // returns to `initial`.
    it('holds an empty selection against another device until the flow is closed', () => {
        const params = {
            incomingDevice: DEVICE_B_UNACQUIRED,
            selectedDevice: undefined,
            physicalDeviceWallets: [DEVICE_A, DEVICE_B_UNACQUIRED],
        };

        expect(
            getShouldSelectConnectedDevice({ ...params, firmware: { status: 'started' } }),
        ).toEqual({ shouldSelect: false, reason: 'other-device-firmware-update' });

        expect(getShouldSelectConnectedDevice({ ...params, firmware: NO_FIRMWARE_UPDATE })).toEqual(
            { shouldSelect: true, reason: 'no-selected-device' },
        );
    });
});
