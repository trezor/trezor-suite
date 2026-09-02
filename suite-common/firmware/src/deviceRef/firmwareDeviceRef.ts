import { type TrezorDevice } from '@suite-common/suite-types';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { type Device, type DeviceUniquePath } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

/**
 * A handle on the physical device that a firmware update is running against, used instead of
 * "whatever device happens to be selected right now".
 *
 * No single field survives a firmware update on its own:
 * - `path` is regenerated on every reconnect, and the device reconnects at least twice
 *   (normal -> bootloader -> normal, plus once more per intermediary firmware),
 * - `deviceId` (`features.device_id`) is `null` while the device sits in bootloader mode and is
 *   regenerated when the device gets wiped, which happens whenever the firmware vendor header
 *   changes (universal <-> bitcoin-only on T2B1 and newer),
 * - `transportId` (`descriptor.id`) survives a reconnect over Bluetooth but not a USB replug.
 *
 * So the ref keeps all of them plus the model, and consumers match on the strongest field that is
 * still available. See `getFirmwareDeviceRefMatch`.
 */
export type FirmwareDeviceRef = {
    deviceId: Device['id'];
    path: DeviceUniquePath;
    transportId: Device['descriptor']['id'];
    // `@trezor/connect` does not re-export the transport-level `ApiType`, and pulling in
    // `@trezor/transport-common` just for it would add a dependency to this package.
    apiType: Device['descriptor']['apiType'] | undefined;
    internalModel: DeviceModelInternal;
    /** Passphrase wallet instance, so we re-select the same wallet the user started from. */
    instance: TrezorDevice['instance'];
};

/**
 * How confidently a device matches a ref, from "this is provably the same physical device" down to
 * "this is the only thing plugged in that could plausibly be it".
 *
 * The values are the ranking itself, so match strengths compare with `>=`.
 */
export const FirmwareDeviceRefMatch = {
    None: 0,
    /** Same internal model only. A guess — never trust it while other candidates exist. */
    Model: 1,
    /** Same connection within the same Suite run. Invalidated by any reconnect. */
    Path: 2,
    /** Transport-level descriptor id is equal. Reliable for Bluetooth, absent for most USB replugs. */
    Transport: 3,
    /** `features.device_id` is equal. The device was not wiped, so this is the same device. */
    DeviceId: 4,
} as const;

export type FirmwareDeviceRefMatch =
    (typeof FirmwareDeviceRefMatch)[keyof typeof FirmwareDeviceRefMatch];

export const createFirmwareDeviceRef = (device: Device | TrezorDevice): FirmwareDeviceRef => ({
    deviceId: device.id ?? null,
    path: device.path,
    transportId: device.descriptor.id,
    apiType: device.descriptor.apiType,
    // Reads the THP properties too, which is where the model lives while a device is unacquired.
    internalModel: getDeviceInternalModel(device),
    instance: 'instance' in device ? device.instance : undefined,
});

/**
 * Rates how well `device` matches `ref`. Only fields present on both sides can produce a match, so
 * a device in bootloader mode (no `device_id`) can still match on transport, path, or model.
 */
export const getFirmwareDeviceRefMatch = (
    device: Device | TrezorDevice,
    ref: FirmwareDeviceRef,
): FirmwareDeviceRefMatch => {
    if (ref.deviceId !== null && device.id === ref.deviceId) {
        return FirmwareDeviceRefMatch.DeviceId;
    }

    // A null/undefined descriptor id means "the transport cannot identify this device", not
    // "this device has the same unidentifiable id as the ref", so both sides must be set.
    if (
        ref.transportId !== null &&
        ref.transportId !== undefined &&
        device.descriptor.id === ref.transportId &&
        device.descriptor.apiType === ref.apiType
    ) {
        return FirmwareDeviceRefMatch.Transport;
    }

    if (device.path === ref.path) {
        return FirmwareDeviceRefMatch.Path;
    }

    if (
        ref.internalModel !== DeviceModelInternal.UNKNOWN &&
        getDeviceInternalModel(device) === ref.internalModel &&
        device.descriptor.apiType === ref.apiType
    ) {
        return FirmwareDeviceRefMatch.Model;
    }

    return FirmwareDeviceRefMatch.None;
};

/**
 * Scores a candidate so that the best one wins a plain `>` comparison.
 *
 * `connected` outweighs the instance on purpose. The same physical device is usually in the list
 * twice — a remembered wallet entry that survived the disconnect with an emptied path, and the live
 * entry it reconnected as — and both match the ref on `device_id`. The remembered one carries the
 * instance the update started from, so ranking by instance first would resolve to an entry that
 * cannot be talked to.
 */
const getCandidateScore = (device: TrezorDevice, ref: FirmwareDeviceRef) =>
    getFirmwareDeviceRefMatch(device, ref) * 4 +
    (device.connected ? 2 : 0) +
    (device.instance === ref.instance ? 1 : 0);

// Resolving on the model alone would silently hand back a different physical device.
const MINIMUM_RESOLVABLE_MATCH = FirmwareDeviceRefMatch.Path;

/**
 * Finds the device the ref points at, preferring the strongest match and, among equally strong
 * matches, a connected device over a remembered one and then the passphrase wallet instance the
 * update was started from.
 */
export const resolveDeviceByFirmwareRef = ({
    devices,
    ref,
}: {
    devices: readonly TrezorDevice[];
    ref: FirmwareDeviceRef | undefined;
}): TrezorDevice | undefined => {
    if (!ref) {
        return undefined;
    }

    let best: { device: TrezorDevice; score: number } | undefined;

    devices.forEach(device => {
        if (getFirmwareDeviceRefMatch(device, ref) < MINIMUM_RESOLVABLE_MATCH) {
            return;
        }

        const score = getCandidateScore(device, ref);

        if (best === undefined || score > best.score) {
            best = { device, score };
        }
    });

    return best?.device;
};

/**
 * Whether `device` is the only thing plugged in that the ref could possibly be pointing at.
 *
 * This is the guard on the model heuristic: adopting a device that merely shares the ref's model is
 * only safe when nothing else could be mistaken for it. Without it, two identical Trezors on one
 * machine would swap identities mid-update.
 */
export const getIsOnlyFirmwareDeviceRefCandidate = ({
    device,
    connectedDevices,
    ref,
}: {
    device: Device | TrezorDevice;
    /** Every device currently connected, including the one that just connected. */
    connectedDevices: readonly (Device | TrezorDevice)[];
    ref: FirmwareDeviceRef;
}) => {
    const candidates = connectedDevices.filter(
        connectedDevice =>
            getFirmwareDeviceRefMatch(connectedDevice, ref) >= FirmwareDeviceRefMatch.Model,
    );

    return candidates.length === 1 && candidates[0]?.path === device.path;
};
