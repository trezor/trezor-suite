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
    /** Another device is present, the selected one included, so the intent is ambiguous. */
    | 'other-device-connected'
    /** A firmware update is running and the device cannot be recognised as the one being updated. */
    | 'other-device-firmware-update';

/** Paired with its reason, so that a reason cannot end up on the verdict it does not belong to. */
export type DeviceSelectionDecision =
    | { shouldSelect: true; reason: SelectDeviceReason }
    | { shouldSelect: false; reason: KeepSelectionReason };

/** Only the firmware state this decision needs, so that the caller may pass the whole reducer. */
type FirmwareState = {
    /** The whole flow, not just the installation: the device also reconnects while pairing over
     * THP, once the update is `done` and after it failed. */
    status: FirmwareStatus | 'error';
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
    // Nothing connected: not how this is called, covered for completeness.
    if (incomingDevice === undefined) {
        return { shouldSelect: false, reason: 'no-connected-device' };
    }

    // Counted by path: an unacquired device has no `id` and one in bootloader mode reports none.
    // Deduplicated, as one physical device can hold several wallets, all on the same path.
    const connectedDevicePaths = [
        ...new Set(
            physicalDeviceWallets.filter(wallet => wallet.connected).map(wallet => wallet.path),
        ),
    ];

    const isIncomingDeviceOnlyDeviceConnected =
        incomingDevice.path !== '' &&
        connectedDevicePaths.length === 1 &&
        connectedDevicePaths[0] === incomingDevice.path;

    // A device that turned up next to the one being updated. The updated device reconnects in
    // bootloader mode, unidentifiable, so only being the one device present tells it apart - the rule
    // `onCallFirmwareUpdate` goes on too, with `deviceList.getOnlyDevice`. Before the selection is
    // read, because the rebooting device is dropped from the list and empties it.
    if (firmware.status !== 'initial' && !isIncomingDeviceOnlyDeviceConnected) {
        return { shouldSelect: false, reason: 'other-device-firmware-update' };
    }

    // Nothing selected: the first device of a fresh Suite, or the selection the update emptied.
    if (selectedDevice === undefined) {
        return { shouldSelect: true, reason: 'no-selected-device' };
    }

    // The device of the selected wallet, back from a reconnect or an update. Compared only when it
    // reports an `id`, or two devices that both lack one would look like a match.
    if (incomingDevice.id != null && incomingDevice.id === selectedDevice.id) {
        return { shouldSelect: true, reason: 'same-device' };
    }

    // The only device present during an update, unidentifiable. It fills an empty selection, above,
    // but does not take one from a wallet: the onboarding compares the id that disconnected with the
    // one present and would report the user has swapped devices.
    if (firmware.status !== 'initial') {
        return { shouldSelect: false, reason: 'other-device-firmware-update' };
    }

    // The selected wallet has no device present, so this one takes over. Not if that device is
    // connected after all - it is counted too, and the paths then differ.
    if (isIncomingDeviceOnlyDeviceConnected) {
        return { shouldSelect: true, reason: 'only-connected-device' };
    }

    // More than one device connected, so which one the user means is not clear.
    return { shouldSelect: false, reason: 'other-device-connected' };
};
