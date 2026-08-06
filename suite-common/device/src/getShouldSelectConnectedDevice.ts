import { type FirmwareStatus, type TrezorDevice } from '@suite-common/suite-types';
import { type Device } from '@trezor/connect';

/** Why the connected device takes the selection over. */
export type SelectDeviceReason =
    /** No wallet is selected yet, the first device that shows up takes the selection. */
    | 'no-selected-device'
    /** The physical device of the selected wallet, remembered or freshly reconnected. */
    | 'same-device'
    /** The selected wallet has no device present and nothing else competes for the selection. */
    | 'only-connected-device';

/** Why the currently selected wallet keeps the selection. */
export type KeepSelectionReason =
    /** Nothing connected, so there is nothing to select. */
    | 'no-connected-device'
    /** The selected wallet already has its device present. */
    | 'selected-device-connected'
    /** Another device is present, so it is not clear which one the user means. */
    | 'other-device-connected'
    /** A firmware update is running and this is not the device being updated. */
    | 'other-device-firmware-update';

/** Paired with its reason, so that a reason cannot end up on the verdict it does not belong to. */
export type DeviceSelectionDecision =
    | { shouldSelect: true; reason: SelectDeviceReason }
    | { shouldSelect: false; reason: KeepSelectionReason };

/** Only the firmware state this decision needs, so that the caller may pass the whole reducer. */
type FirmwareState = {
    status: FirmwareStatus | 'error';
    cachedDevice?: TrezorDevice;
};

type GetShouldSelectConnectedDeviceParams = {
    /** The device that has just connected. */
    connectedDevice: Device | TrezorDevice | undefined;
    /** The wallet selected so far, whose device may or may not be present. */
    selectedDevice: TrezorDevice | undefined;
    /** All wallets of all physical devices, i.e. `selectPhysicalDeviceWallets`. */
    physicalDeviceWallets: readonly TrezorDevice[];
    firmware: FirmwareState;
};

/**
 * `descriptor.id` identifies the physical device across reconnects, unlike `path`, which is
 * assigned per connection, and unlike `id`, which a device in bootloader mode does not report.
 */
const isSamePhysicalDevice = (
    a: Device | TrezorDevice | undefined,
    b: Device | TrezorDevice | undefined,
) => {
    const descriptorId = a?.descriptor?.id;

    // A nullish `descriptor.id` means "unknown", not "no id": it is optional in the transport
    // layer and old bridge does not report it at all. Two unknowns must never look like a match.
    if (descriptorId != null && descriptorId === b?.descriptor?.id) {
        return true;
    }

    // `descriptor.id` is scoped to the transport, so the same device reached over another one does
    // not match by it. `id` is reported whenever the device is not in bootloader mode.
    return a?.id != null && a.id === b?.id;
};

/**
 * Decides whether a newly connected device takes over the selection from the currently selected
 * wallet. Pure, so that the rules can be read and tested in one place - the caller only feeds it
 * the state it needs.
 */
export const getShouldSelectConnectedDevice = ({
    connectedDevice,
    selectedDevice,
    physicalDeviceWallets,
    firmware,
}: GetShouldSelectConnectedDeviceParams): DeviceSelectionDecision => {
    if (connectedDevice === undefined) {
        return { shouldSelect: false, reason: 'no-connected-device' };
    }

    // Checked before anything else: the device being updated disconnects and reconnects, and while
    // it is away the selection can end up empty, which would otherwise let any device take it.
    // While an update is running, only the device it started on may take the selection.
    // `status` covers the whole flow, not just the installation: the device also reconnects while
    // pairing over THP, after the update is `done` and after it failed.
    if (
        firmware.status !== 'initial' &&
        !isSamePhysicalDevice(firmware.cachedDevice, connectedDevice)
    ) {
        return { shouldSelect: false, reason: 'other-device-firmware-update' };
    }

    if (selectedDevice === undefined) {
        return { shouldSelect: true, reason: 'no-selected-device' };
    }

    // Compared only when the connected device reports an `id`, otherwise two devices that both
    // lack one - an unacquired device has none and a device in bootloader mode reports `null` -
    // would look like a match.
    if (connectedDevice.id != null && connectedDevice.id === selectedDevice.id) {
        return { shouldSelect: true, reason: 'same-device' };
    }

    if (selectedDevice.connected) {
        return { shouldSelect: false, reason: 'selected-device-connected' };
    }

    // Wallets are matched by path, because an unacquired device has no `id` yet and a device
    // reconnecting in bootloader mode reports none either.
    const isOnlyConnectedDevice = physicalDeviceWallets.every(
        wallet => !wallet.connected || wallet.path === connectedDevice.path,
    );

    return isOnlyConnectedDevice
        ? { shouldSelect: true, reason: 'only-connected-device' }
        : { shouldSelect: false, reason: 'other-device-connected' };
};
