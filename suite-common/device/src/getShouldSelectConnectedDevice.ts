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
    incomingDevice: Device | TrezorDevice | undefined;
    /** The wallet selected so far, whose device may or may not be present. */
    selectedDevice: TrezorDevice | undefined;
    /** All wallets of all physical devices, i.e. `selectPhysicalDeviceWallets`. */
    physicalDeviceWallets: readonly TrezorDevice[];
    firmware: FirmwareState;
};

/**
 * Neither identifier alone recognises a device that comes back, so both are compared:
 *
 * - `descriptor.id` is stable across reconnects, unlike `path`, which is assigned per connection,
 *   and it is reported in bootloader mode, unlike `id`. It is scoped to the transport that reports
 *   it, though - a device reached over USB and over Bluetooth has a different one of each.
 * - `id` is the same on every transport, but a device in bootloader mode does not report it.
 *
 * What is left uncovered is a device in bootloader mode arriving on another transport than it left
 * on, which has nothing in common with the device it was. It is then taken for an unrelated device,
 * which is the safe way to be wrong here: nothing is selected, rather than the wrong wallet.
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

    // Same as above: a device that reports no `id` must not match another one that reports none.
    return a?.id != null && a.id === b?.id;
};

/**
 * Decides whether a newly connected device takes over the selection from the currently selected
 * wallet. Pure, so that the rules can be read and tested in one place - the caller only feeds it
 * the state it needs.
 */
export const getShouldSelectConnectedDevice = ({
    incomingDevice,
    selectedDevice,
    physicalDeviceWallets,
    firmware,
}: GetShouldSelectConnectedDeviceParams): DeviceSelectionDecision => {
    // This function should be called when there is an incoming device being connected, but just to cover all cases:
    if (incomingDevice === undefined) {
        return { shouldSelect: false, reason: 'no-connected-device' };
    }

    // Checked before anything else: while an update runs, no device may take the selection - except
    // the device being updated, which is what the comparison is for. It disconnects and reconnects
    // in bootloader mode, and while it is away the selection can end up empty, which would
    // otherwise let any device take it. Its reconnect is also the only chance to select it again.
    // `status` covers the whole flow, not just the installation: the device also reconnects while
    // pairing over THP, after the update is `done` and after it failed.
    const isDeviceBeingUpdated = isSamePhysicalDevice(firmware.cachedDevice, incomingDevice);

    if (firmware.status !== 'initial' && !isDeviceBeingUpdated) {
        return { shouldSelect: false, reason: 'other-device-firmware-update' };
    }

    if (selectedDevice === undefined) {
        return { shouldSelect: true, reason: 'no-selected-device' };
    }

    // Compared only when the incoming device reports an `id`, otherwise two devices that both
    // lack one - an unacquired device has none and a device in bootloader mode reports `null` -
    // would look like a match.
    if (incomingDevice.id != null && incomingDevice.id === selectedDevice.id) {
        return { shouldSelect: true, reason: 'same-device' };
    }

    if (selectedDevice.connected) {
        return { shouldSelect: false, reason: 'selected-device-connected' };
    }

    // Wallets are matched by path, because an unacquired device has no `id` yet and a device
    // reconnecting in bootloader mode reports none either.
    const isOnlyConnectedDevice = physicalDeviceWallets.every(
        wallet => !wallet.connected || wallet.path === incomingDevice.path,
    );

    return isOnlyConnectedDevice
        ? { shouldSelect: true, reason: 'only-connected-device' }
        : { shouldSelect: false, reason: 'other-device-connected' };
};
