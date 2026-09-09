import { type WithServices, createThunk } from '@suite-common/redux-utils';
import {
    type AcquiredDevice,
    type DeviceReceiverDep,
    type TrezorDevice,
    selectDeviceReceiverDep,
} from '@suite-common/suite-types';

import { DEVICE_MODULE_PREFIX } from './deviceConstants';
import { type DeviceRootState } from './deviceReducer';
import { selectDevices } from './deviceSelectors';
import { getIsDeviceConnectedAndAcquired } from './deviceUtils';

type DeviceApiType = TrezorDevice['descriptor']['apiType'];

/**
 * Long enough for a device to finish rebooting and be acquired, short enough that a caller
 * awaiting it does not hang on a device that never comes back.
 */
const DEFAULT_TIMEOUT_MS = 30_000;

type WaitForConnectedDeviceParams = {
    /**
     * Which transport the device is expected on. A device of another transport is not a candidate
     * and does not make the wait ambiguous.
     */
    apiType: DeviceApiType;
    /**
     * Where the operation last saw the device, when it reports that — `@trezor/connect` returns the
     * path of the device a call ran on. Taken as the answer when a device turns up there, and
     * ignored otherwise: a reboot can re-enumerate the device under a new path, which is the case
     * the single-candidate rule below covers.
     */
    path?: string;
    timeoutMs?: number;
};

const getCandidates = (devices: readonly TrezorDevice[], apiType: DeviceApiType) =>
    devices.filter(
        (device): device is AcquiredDevice =>
            getIsDeviceConnectedAndAcquired(device) && device.descriptor.apiType === apiType,
    );

const resolveDevice = (
    devices: readonly TrezorDevice[],
    { apiType, path }: Pick<WaitForConnectedDeviceParams, 'apiType' | 'path'>,
): AcquiredDevice | undefined => {
    const candidates = getCandidates(devices, apiType);
    const deviceAtPath = path ? candidates.find(device => device.path === path) : undefined;

    return deviceAtPath ?? (candidates.length === 1 ? candidates[0] : undefined);
};

/**
 * Resolves with the single usable device on `apiType`, waiting for it to turn up if it is not
 * there yet.
 *
 * This exists because "the operation finished" and "the device is in the store" are two different
 * moments. `@trezor/connect` returns from a firmware update once it has re-enumerated and released
 * the device, but the store is filled from the connect event that travels separately, so a caller
 * that awaits the update may look for its device before the entry exists. Waiting here turns that
 * race into a sequence.
 *
 * Ambiguity is deliberately not resolved: with a second device attached the wait keeps going
 * rather than guessing, which is also what `@trezor/connect` does while it waits for a device to
 * come back.
 *
 * Resolves `undefined` on timeout, which the caller must handle — a device that never returned is
 * an ordinary outcome of an interrupted update, not an error.
 */
type WaitForConnectedDeviceThunkState = DeviceRootState;

type WaitForConnectedDeviceThunkDeps = WithServices<DeviceReceiverDep>;

export const waitForConnectedDeviceThunk = createThunk<
    AcquiredDevice | undefined,
    WaitForConnectedDeviceParams,
    { state: WaitForConnectedDeviceThunkState; extra: WaitForConnectedDeviceThunkDeps }
>(
    `${DEVICE_MODULE_PREFIX}/waitForConnectedDevice`,
    ({ apiType, path, timeoutMs = DEFAULT_TIMEOUT_MS }, { getState, extra, fulfillWithValue }) => {
        const { deviceReceiver } = selectDeviceReceiverDep(extra.services);

        const alreadyConnected = resolveDevice(selectDevices(getState()), { apiType, path });

        if (alreadyConnected) {
            return fulfillWithValue(alreadyConnected);
        }

        return new Promise<AcquiredDevice | undefined>(resolve => {
            // Held in one object so that settling can dispose of both without either of them
            // having to be declared before the function that disposes of them.
            const pending: {
                timeout?: ReturnType<typeof setTimeout>;
                unsubscribe?: () => void;
            } = {};

            const settle = (device: AcquiredDevice | undefined) => {
                clearTimeout(pending.timeout);
                pending.unsubscribe?.();
                resolve(device);
            };

            pending.timeout = setTimeout(() => settle(undefined), timeoutMs);

            // The receiver publishes a device only once the store already holds it acquired, so
            // what it hands over is the entry the caller is about to select. The store is still
            // consulted, for the one thing the delivered device cannot say: whether something else
            // is attached that makes "the device" ambiguous.
            pending.unsubscribe = deviceReceiver.onDeviceConnected(device => {
                if (device.descriptor.apiType !== apiType) {
                    return;
                }

                if (path && device.path === path) {
                    settle(device);

                    return;
                }

                const otherCandidates = getCandidates(selectDevices(getState()), apiType).filter(
                    other => other.path !== device.path,
                );

                if (otherCandidates.length === 0) {
                    settle(device);
                }
            });
        }).then(fulfillWithValue);
    },
);
