import { bluetoothActions } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { AcquiredDevice, DeviceRef, TrezorDevice } from '@suite-common/suite-types';
import { getDeviceInstances, sortByTimestamp } from '@suite-common/suite-utils';
import {
    autoInitThpAfterDeviceConnectionThunk,
    connectThpDeviceThunk,
    thpActions,
} from '@suite-common/thp';
import { notificationsActions } from '@suite-common/toast-notifications';
import { AccountKey } from '@suite-common/wallet-types';
import {
    getAddressType,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
} from '@suite-common/wallet-utils';
import TrezorConnect, {
    Address,
    CardanoAddress,
    Response as ConnectResponse,
    DEVICE,
    Device,
} from '@trezor/connect';
import { getFirmwareVersion } from '@trezor/device-utils';
import { getEnvironment } from '@trezor/env-utils';
import { exhaustive } from '@trezor/type-utils';
import { isChanged } from '@trezor/utils';

import { DEVICE_MODULE_PREFIX, deviceActions } from './deviceActions';
import { PORTFOLIO_TRACKER_DEVICE_ID, portfolioTrackerDevice } from './deviceConstants';
import {
    selectDeviceByDeviceRef,
    selectDeviceById,
    selectDevices,
    selectPhysicalDevices,
    selectSelectedDevice,
} from './deviceSelectors';
import { selectAccountByKey } from '../accounts/accountsSelectors';
import { startDiscoveryThunk } from '../discovery/discoveryThunks';

type SelectDeviceThunkParams = {
    device: Device | TrezorDevice | undefined;
};

/**
 * @param {(TrezorDevice)} device
 * @param {TrezorDevice[]} devices
 * @returns {TrezorDevice | undefined }
 */
const getSelectedDevice = (
    device: Device | TrezorDevice,
    devices: TrezorDevice[],
): TrezorDevice | undefined => {
    // selected device is not acquired

    if ('ts' in device) {
        const { path, instance } = device;

        return devices.find(d => {
            if ((!d.features || d.mode === 'bootloader') && d.path === path) {
                return true;
            }
            if (d.instance === instance && d.features && d.id === device.id) {
                return true;
            }

            // special case we need to use after wipe device (which changes device_id)
            if (d.instance === instance && d.path.length > 0 && d.path === device.path) {
                return true;
            }

            return false;
        });
    } else {
        const instances = devices.filter(d => d.path === device.path);

        return sortByTimestamp(instances)[0];
    }
    // todo: maybe select by staticSessionId || device_id || path
};

/**
 * Called from:
 * - `@trezor/connect` events handler `handleDeviceConnect`, `handleDeviceDisconnect`
 * - from user action in `@suite-components/DeviceMenu`
 */
export const selectDeviceThunk = createThunk<void, SelectDeviceThunkParams, void>(
    `${DEVICE_MODULE_PREFIX}/selectDevice`,
    ({ device }, { dispatch, getState }) => {
        let payload: TrezorDevice | typeof undefined;
        const devices = selectDevices(getState());

        if (device) {
            payload = getSelectedDevice(device, devices);
        }

        dispatch(deviceActions.selectDevice(payload));
    },
);

/**
 * Toggles remembering the given device. I.e. if given device is not remembered it will become remembered
 * and if it is remembered it will be forgotten.
 * @param forceRemember can be set to `true` to remember given device regardless of its current state.
 *
 * Use `forgetDevice` to forget a device regardless if its current state.
 */
export const toggleRememberDevice = createThunk(
    `${DEVICE_MODULE_PREFIX}/toggleRememberDevice`,
    ({ device, forceRemember }: { device: TrezorDevice; forceRemember?: true }, { dispatch }) =>
        dispatch(
            deviceActions.rememberDevice({
                device,
                remember: !device.remember || !!forceRemember,
                // if device is already remembered, do not force it, it would remove the remember on return to suite
                forceRemember: device.remember ? undefined : forceRemember,
            }),
        ),
);

/**
 * Triggered by `@trezor/connect DEVICE_EVENT`
 * @param {Device} device
 */
export const handleDeviceDisconnect = createThunk(
    `${DEVICE_MODULE_PREFIX}/handleDeviceDisconnect`,
    (device: Device | TrezorDevice, { dispatch, getState, extra }) => {
        const {
            selectors: { selectRouterApp },
        } = extra;

        // eslint-disable-next-line no-restricted-syntax
        const selectedDevice = getState().device.selectedDevice as DeviceRef;
        // no device was selected
        if (!selectedDevice) {
            return;
        }

        // the device that got disconnected or forgotten was not selected
        if (
            selectedDevice !== device.path &&
            selectedDevice !== device?.id &&
            // @ts-expect-error todo: typing
            selectedDevice !== device?.state?.staticSessionId
        ) {
            return;
        }

        // at this point, we know that the device that got disconnected was also the selected one

        /**
         * Under normal circumstances, after device is disconnected we want suite to select another existing device (either remembered or physically connected)
         * This is not the case in firmware update and onboarding; In this case we simply wan't suite.device to be empty until user reconnects a device again
         */
        const routerApp = selectRouterApp(getState());
        if (['onboarding', 'firmware', 'firmware-type'].includes(routerApp)) {
            dispatch(selectDeviceThunk({ device: undefined }));

            return;
        }

        const devices = selectDevices(getState());

        const devicePresent = selectDeviceByDeviceRef(
            getState(),
            selectedDevice.split(':')[0].split('@')[1], // use device_id only
        );

        // try to select another wallet instance of the same physical device
        const deviceInstances = !devicePresent
            ? []
            : getDeviceInstances(devicePresent, devices).filter(
                  d => d.id !== selectedDevice && d.state !== devicePresent.state,
              );
        if (deviceInstances.length > 0) {
            dispatch(
                selectDeviceThunk({
                    device: deviceInstances[deviceInstances.length - 1],
                }),
            );

            return;
        }
        // else select another physical device
        const physicalDevices = selectPhysicalDevices(getState());
        if (physicalDevices.length > 0) {
            dispatch(
                selectDeviceThunk({
                    device: sortByTimestamp(physicalDevices)[0],
                }),
            );
        } else {
            // clear selectedDevice field
            dispatch(selectDeviceThunk({ device: undefined }));
        }
    },
);

/**
 * Triggered by `@trezor/connect DEVICE_EVENT` via suiteMiddleware
 * Remove all data related to all instances of disconnected device if they are not remembered
 * @param {Device} device
 */
export const forgetDisconnectedDevices = createThunk(
    `${DEVICE_MODULE_PREFIX}/forgetDisconnectedDevices`,
    (params: { device: Device | TrezorDevice; forceForget?: boolean }, { dispatch, getState }) => {
        const { device, forceForget = false } = params;
        const devices = selectDevices(getState());
        const deviceInstances = devices.filter(d => d.id === device.id);

        deviceInstances.forEach(d => {
            if (
                d.features &&
                (forceForget ||
                    !d.remember ||
                    // Forget if not in normal state
                    !d.id ||
                    !d.state ||
                    d.mode !== 'normal')
            ) {
                dispatch(deviceActions.forgetDevice({ device: d }));
            }
        });
    },
);

/**
 * Called from `suiteMiddleware`
 * Keep `suite` reducer synchronized with `devices` reducer
 */
export const observeSelectedDevice =
    (prevSelectedDevice?: TrezorDevice) => (dispatch: any, getState: any) => {
        const nextSelectedDevice = selectSelectedDevice(getState());
        if (!nextSelectedDevice) return;
        // todo: and this could be a performance issue, but I need to figure out a save way how to get rid of updateSelectedDevice or how to fire it in a different way
        const changed = isChanged(prevSelectedDevice || undefined, nextSelectedDevice);
        if (changed) {
            dispatch(deviceActions.updateSelectedDevice(nextSelectedDevice));
        }
    };

/**
 * Called from <AcquireDevice /> component
 * Fetch device features without asking for pin/passphrase
 * this is the only place where useEmptyPassphrase should be always set to "true"
 */
export const acquireDevice = createThunk(
    `${DEVICE_MODULE_PREFIX}/acquireDevice`,
    async (
        {
            requestedDevice,
            startDiscovery,
        }: {
            requestedDevice?: TrezorDevice | null;
            startDiscovery?: boolean;
        },
        { dispatch, getState },
    ) => {
        const device = requestedDevice ?? selectSelectedDevice(getState());

        if (!device) return;

        const response = await TrezorConnect.getFeatures({
            device,
            // todo: it shouldn't be needed I think - getFeatures is not touching device.state, is it?
            useEmptyPassphrase: true,
        });

        if (!response.success) {
            if (response.payload.code === 'Device_ThpPairingTagInvalid') {
                dispatch(thpActions.invalidCode());
            } else {
                dispatch(
                    notificationsActions.addToast({
                        type: 'acquire-error',
                        device,
                        error: response.payload.error,
                    }),
                );
                if (device?.thp?.properties !== undefined) {
                    dispatch(thpActions.resetThpFlow());
                }
            }
        } else if (startDiscovery) {
            dispatch(
                startDiscoveryThunk({
                    device,
                }),
            );
        }
    },
);

// Sort devices by timestamp and put Portfolio Tracker device at the end.
export const sortDevices = (devices: TrezorDevice[]) => {
    const sortedDevicesByTimestamp = sortByTimestamp([...devices]);

    const containsPortfolioTrackerDevices = sortedDevicesByTimestamp.filter(
        device => device.id === PORTFOLIO_TRACKER_DEVICE_ID,
    );

    return sortedDevicesByTimestamp
        .filter(device => device.id !== PORTFOLIO_TRACKER_DEVICE_ID)
        .concat(containsPortfolioTrackerDevices);
};

export const initDevices = createThunk(
    `${DEVICE_MODULE_PREFIX}/initDevices`,
    (_, { dispatch, getState }) => {
        const devices = selectDevices(getState());

        const device = selectSelectedDevice(getState());

        if (!device && devices?.[0]) {
            // if there are force remember devices, forget them and pick the first one of them as selected device
            const forcedDevices = devices.filter(d => d.forceRemember && d.remember);
            forcedDevices.forEach(d => {
                dispatch(toggleRememberDevice({ device: d }));
            });

            dispatch(
                selectDeviceThunk({
                    device: forcedDevices.length ? forcedDevices[0] : sortDevices(devices)[0],
                }),
            );
        }
    },
);

export const createImportedDeviceThunk = createThunk<
    { device: TrezorDevice },
    undefined,
    { rejectValue: { error: 'already-created' } }
>(
    `${DEVICE_MODULE_PREFIX}/createImportedDevice`,
    (_, { dispatch, getState, rejectWithValue, fulfillWithValue }) => {
        const device = selectDeviceById(getState(), PORTFOLIO_TRACKER_DEVICE_ID);

        if (device) return rejectWithValue({ error: 'already-created' });

        dispatch(
            deviceActions.createDeviceInstance({
                device: portfolioTrackerDevice,
            }),
        );

        return fulfillWithValue({ device: portfolioTrackerDevice });
    },
);

type ConfirmAddressOnDeviceThunk = {
    accountKey: AccountKey;
    addressPath: string;
    chunkify: boolean;
    showOnTrezor?: boolean;
};

export const confirmAddressOnDeviceThunk = createThunk(
    `${DEVICE_MODULE_PREFIX}/confirmAddressOnDeviceThunk`,
    async (
        { accountKey, addressPath, chunkify, showOnTrezor = true }: ConfirmAddressOnDeviceThunk,
        { getState },
    ): Promise<ConnectResponse<Address | CardanoAddress>> => {
        const device = selectSelectedDevice(getState());
        const account = selectAccountByKey(getState(), accountKey);

        if (!device || !account)
            return {
                success: false,
                payload: { error: 'Device or account does not exist.', code: undefined },
            };

        const params = {
            device,
            path: addressPath,
            unlockPath: account.unlockPath,
            useEmptyPassphrase: device.useEmptyPassphrase,
            coin: account.symbol,
            chunkify,
            showOnTrezor,
        };

        let response;

        const isCardanoAddressChunked = getEnvironment() === 'mobile';

        switch (account.networkType) {
            case 'ethereum':
                response = await TrezorConnect.ethereumGetAddress(params);
                break;
            case 'cardano':
                response = TrezorConnect.cardanoGetAddress({
                    device,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                    addressParameters: {
                        stakingPath: getStakingPath(account),
                        addressType: getAddressType(),
                        path: addressPath,
                    },
                    protocolMagic: getProtocolMagic(account.symbol),
                    networkId: getNetworkId(account.symbol),
                    derivationType: getDerivationType(account.accountType),
                    chunkify: isCardanoAddressChunked,
                });
                break;
            case 'ripple':
                response = TrezorConnect.rippleGetAddress(params);
                break;
            case 'bitcoin':
                response = TrezorConnect.getAddress(params);
                break;
            case 'solana':
                response = TrezorConnect.solanaGetAddress(params);
                break;
            case 'stellar':
                response = TrezorConnect.stellarGetAddress(params);
                break;
            default:
                response = {
                    success: false,
                    payload: { error: 'Method for getAddress not defined', code: undefined },
                } as const;
        }

        return response;
    },
);

type DeviceConnectThunkEventType = typeof DEVICE.CONNECT | typeof DEVICE.CONNECT_UNACQUIRED;

type DeviceConnectThunksParams = {
    type: DeviceConnectThunkEventType;
    device: Device;
};

export const deviceConnectThunks = createThunk<void, DeviceConnectThunksParams, void>(
    `${DEVICE_MODULE_PREFIX}/deviceConnectThunk`,
    ({ type, device }, { dispatch }) => {
        switch (type) {
            case DEVICE.CONNECT:
                dispatch(deviceActions.connectDevice({ device }));
                dispatch(connectThpDeviceThunk({ device }));
                break;
            case DEVICE.CONNECT_UNACQUIRED:
                dispatch(
                    deviceActions.connectUnacquiredDevice({
                        device,
                    }),
                );
                dispatch(autoInitThpAfterDeviceConnectionThunk({ device }));
                break;
            default:
                exhaustive(type);
        }
    },
);

export const wipeDeviceThunk = createThunk(
    `${DEVICE_MODULE_PREFIX}/wipeDevice`,
    async (_, { dispatch, getState, extra, rejectWithValue }) => {
        const device = selectSelectedDevice(getState());
        if (!device) return;
        const isBootloaderMode = device.mode === 'bootloader';
        const devices = selectDevices(getState());
        // collect devices with old "device.id" to be removed (see description below)
        const deviceInstances = getDeviceInstances(device, devices);
        const result = await TrezorConnect.wipeDevice({
            device: {
                path: device.path,
            },
            // In bootloader mode we need the skip the final reload, otherwise we never get the resolution
            // THP device will require pairing. THP state is cleared, credentials are invalid
            skipFinalReload: isBootloaderMode || !!device.thp,
        });

        if (
            result.success ||
            // This is an expected success for Bluetooth-connected devices
            (device.bluetoothProps !== undefined && result.payload.code === 'Device_Disconnected')
        ) {
            // Wiping a device triggers device.id change, and this change is propagated to device reducer via @trezor/connect DEVICE.CHANGE event.
            // Accounts data are related to the old device.id; to properly clear reducers and indexed db,
            // we need to retrieve device objects BEFORE and AFTER the wipe process.
            // And call SUITE.FORGET_DEVICE on ALL devices (with old and new device.id)
            if (device.bluetoothProps !== undefined) {
                dispatch(
                    bluetoothActions.removeKnownDeviceAction({ id: device.bluetoothProps.id }),
                );
                dispatch(
                    extra.thunks.forgetBluetoothDevice({ bluetoothId: device.bluetoothProps.id }),
                );
            }

            deviceInstances.forEach(d => {
                dispatch(deviceActions.forgetDevice({ device: d }));
            });
            dispatch(notificationsActions.addToast({ type: 'device-wiped' }));

            // Special case with webusb: Device after wipe changes device_id. With webusb transport, device_id is used as a path
            // and thus as a descriptor for webusb. So, after the device is wiped, in the transport layer, the device is still paired
            // through the old descriptor, but suite already works with a new one. It kinda works, but only until we try a new call,
            // typically resetDevice when in onboarding - we get a device-disconnected error.
            //
            // Edit 1: disconnecting the device wiped from bootloader mode is also necessary.
            // Edit 2: encountered libusb error with bridge 2.0.27. So let's enforce disconnecting for all devices.
            dispatch(deviceActions.requestDeviceReconnect());
        } else {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.payload.error }));

            return rejectWithValue(result.payload.error);
        }
    },
);

export const toggleAutoEjectThunk = createThunk(
    `${DEVICE_MODULE_PREFIX}/toggleAutoEjectThunk`,
    (_, { dispatch, getState }) => {
        const physicalDevices = selectPhysicalDevices(getState());
        dispatch(deviceActions.toggleIsDeviceAutoEjectEnabled());

        physicalDevices.forEach(wallet => {
            if (!wallet.connected && wallet.remember) {
                dispatch(deviceActions.forgetDevice({ device: wallet }));
            } else {
                dispatch(
                    deviceActions.rememberDevice({
                        device: wallet,
                        remember: !wallet.remember,
                    }),
                );
            }
        });
    },
);

type FailEntropyCheckParams = {
    device: AcquiredDevice;
    error: string;
};

export const failEntropyCheckThunk = createThunk(
    `${DEVICE_MODULE_PREFIX}/failEntropyCheckThunk`,
    ({ device, error }: FailEntropyCheckParams, { dispatch, extra }) => {
        const contextData = {
            model: device?.features?.internal_model,
            revision: device?.features?.revision,
            version: getFirmwareVersion(device),
            vendor: device?.features?.fw_vendor,
        };
        extra.utils.reportSecurityCheck({
            level: 'error',
            checkType: 'Entropy',
            contextData,
            payload: error,
        });

        const temporarilySkippedErrorsToBeInvestigated = [
            // These errors show up in Sentry and they probably lead to false positives.
            // We should improve the logs to include stack traces so that we can investigate and fix this problem, then remove this condition.
            'unexpected error',
            'A transfer error has occurred',
            // This one was not in Sentry but can be triggered by manually disconnecting the device. Investigate. https://github.com/trezor/trezor-suite-private/issues/135
            'device disconnected during action',
        ];
        if (!temporarilySkippedErrorsToBeInvestigated.includes(error)) {
            dispatch(deviceActions.setEntropyCheckFail(device.id));
        }
    },
);
