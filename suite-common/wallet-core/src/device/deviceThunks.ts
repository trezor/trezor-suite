import { bluetoothActions } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import {
    getDeviceInstances,
    getFirstDeviceInstance,
    getNewInstanceNumber,
    getSelectedDevice,
    sortByTimestamp,
} from '@suite-common/suite-utils';
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
    StaticSessionId,
    UI,
} from '@trezor/connect';
import { getEnvironment } from '@trezor/env-utils';
import { bluetoothIpc } from '@trezor/transport-bluetooth';
import { exhaustive } from '@trezor/type-utils';
import { isChanged } from '@trezor/utils';

import { DEVICE_MODULE_PREFIX, deviceActions } from './deviceActions';
import { PORTFOLIO_TRACKER_DEVICE_ID, portfolioTrackerDevice } from './deviceConstants';
import {
    selectDeviceByBaseStaticSessionId,
    selectDeviceById,
    selectDevices,
    selectSelectedDevice,
} from './deviceSelectors';
import { selectAccountByKey } from '../accounts/accountsSelectors';
import { cancelDiscoveryThunk, startDiscoveryThunk } from '../discovery/discoveryThunks';

type SelectDeviceThunkParams = {
    device: Device | TrezorDevice | undefined;
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
            // "ts" is one of the field which distinguish Device from TrezorDevice
            // (device from connect doesn't have timestamp but suite device has)
            if ('ts' in device) {
                // requested device is a @suite TrezorDevice type. get exact instance from reducer
                payload = getSelectedDevice(device, devices);
            } else {
                // requested device is a @trezor/connect Device type
                // find all instances and select recently used
                const instances = devices.filter(d => d.path === device.path);

                payload = sortByTimestamp(instances)[0];
            }
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

export type CreateDeviceInstanceError = {
    error: 'passphrase-enabling-cancelled' | 'features-unavailable';
};

type CreateDeviceInstanceParams = { device: TrezorDevice; useEmptyPassphrase: boolean };

export const createDeviceInstanceThunk = createThunk<
    { device: TrezorDevice },
    CreateDeviceInstanceParams,
    { rejectValue: CreateDeviceInstanceError }
>(
    `${DEVICE_MODULE_PREFIX}/createDeviceInstance`,
    async (
        { device, useEmptyPassphrase = false },
        { dispatch, getState, rejectWithValue, fulfillWithValue },
    ) => {
        if (!device.features) return rejectWithValue({ error: 'features-unavailable' });
        if (!device.features.passphrase_protection) {
            const response = await TrezorConnect.applySettings({
                device,
                use_passphrase: true,
            });

            if (!response.success) {
                dispatch(
                    notificationsActions.addToast({ type: 'error', error: response.payload.error }),
                );

                return rejectWithValue({ error: 'passphrase-enabling-cancelled' });
            }

            dispatch(notificationsActions.addToast({ type: 'settings-applied' }));
        }

        const devices = selectDevices(getState());

        const newDeviceInstance: TrezorDevice = {
            ...device,
            useEmptyPassphrase,
            instance: getNewInstanceNumber(devices, device),
        };
        dispatch(deviceActions.createDeviceInstance({ device: newDeviceInstance }));

        return fulfillWithValue({
            device: newDeviceInstance,
        });
    },
);

/**
 * Triggered by `@trezor/connect DEVICE_EVENT`
 * @param {Device} device
 */
export const handleDeviceConnect = createThunk(
    `${DEVICE_MODULE_PREFIX}/handleDeviceConnect`,
    (device: Device, { dispatch, getState }) => {
        const selectedDevice = selectSelectedDevice(getState());

        if (!selectedDevice) {
            dispatch(selectDeviceThunk({ device }));
        } else {
            // TODO: show some nice notification/tooltip in DeviceMenu
        }
    },
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

        const selectedDevice = selectSelectedDevice(getState());
        const routerApp = selectRouterApp(getState());
        const devices = selectDevices(getState());
        if (!selectedDevice) return;
        if (selectedDevice.path !== device.path) return;

        /**
         * Under normal circumstances, after device is disconnected we want suite to select another existing device (either remembered or physically connected)
         * This is not the case in firmware update and onboarding; In this case we simply wan't suite.device to be empty until user reconnects a device again
         */
        if (['onboarding', 'firmware', 'firmware-type'].includes(routerApp)) {
            dispatch(selectDeviceThunk({ device: undefined }));

            return;
        }

        // selected device is disconnected, decide what to do next
        // device is still present in reducer (remembered or candidate to remember)
        const devicePresent = getSelectedDevice(selectedDevice, devices);
        const deviceInstances = getDeviceInstances(selectedDevice, devices);
        if (deviceInstances.length > 0) {
            // if selected device is gone from reducer, switch to first instance
            if (!devicePresent) {
                dispatch(selectDeviceThunk({ device: deviceInstances[0] }));
            }

            return;
        }

        const available = getFirstDeviceInstance(devices);
        dispatch(selectDeviceThunk({ device: available[0] }));
    },
);

/**
 * Triggered by `@trezor/connect DEVICE_EVENT` via suiteMiddleware
 * Remove all data related to all instances of disconnected device if they are not remembered
 * @param {Device} device
 */
export const forgetDisconnectedDevices = createThunk(
    `${DEVICE_MODULE_PREFIX}/forgetDisconnectedDevices`,
    (device: Device | TrezorDevice, { dispatch, getState, extra }) => {
        const devices = selectDevices(getState());
        const deviceInstances = devices.filter(d => d.id === device.id);

        const settings = extra.selectors.selectSuiteSettings(getState());

        deviceInstances.forEach(d => {
            if (d.features && !d.remember) {
                dispatch(deviceActions.forgetDevice({ device: d, settings }));
            }
        });
    },
);

/**
 * Called from `suiteMiddleware`
 * Keep `suite` reducer synchronized with `devices` reducer
 */
export const observeSelectedDevice = () => (dispatch: any, getState: any) => {
    const devices = selectDevices(getState());

    const selectedDevice = selectSelectedDevice(getState());

    if (!selectedDevice) return false;

    const deviceFromReducer = getSelectedDevice(selectedDevice, devices);
    if (!deviceFromReducer) return true;

    const changed = isChanged(selectedDevice, deviceFromReducer);
    if (changed) {
        dispatch(deviceActions.updateSelectedDevice(deviceFromReducer));
    }

    return changed;
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
            useEmptyPassphrase: true,
        });

        if (!response.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'acquire-error',
                    device,
                    error: response.payload.error,
                }),
            );
        }

        if (startDiscovery) {
            dispatch(
                startDiscoveryThunk({
                    device,
                }),
            );
        }
    },
);

export const switchDuplicatedDevice = createThunk(
    `${DEVICE_MODULE_PREFIX}/switchDuplicatedDevice`,
    async (passphraseDuplicateStaticSessionId: StaticSessionId, { dispatch, getState, extra }) => {
        const {
            actions: { onModalCancel },
        } = extra;
        // close modal
        dispatch(onModalCancel());

        const device = selectDeviceByBaseStaticSessionId(
            getState(),
            passphraseDuplicateStaticSessionId,
        );

        if (!device) {
            console.error('switchDuplicatedDevice: Device not found');

            return;
        }

        dispatch(cancelDiscoveryThunk(device));

        // release session from authorizeDevice
        await TrezorConnect.getFeatures({
            device,
            keepSession: false,
        });

        // switch to existing wallet
        dispatch(selectDeviceThunk({ device }));
    },
);

// Sort devices by timestamp and put Portfolio Tracker device at the end.
const sortDevices = (devices: TrezorDevice[]) =>
    sortByTimestamp([...devices]).sort((a, b) => {
        if (a.id === b.id) {
            return 0;
        }
        if (a.id === PORTFOLIO_TRACKER_DEVICE_ID) {
            return 1;
        }

        return -1;
    });

export const initDevices = createThunk(
    `${DEVICE_MODULE_PREFIX}/initDevices`,
    (_, { dispatch, getState }) => {
        const devices = selectDevices(getState());

        const device = selectSelectedDevice(getState());

        if (!device && devices && devices[0]) {
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

        dispatch(deviceActions.createDeviceInstance({ device: portfolioTrackerDevice }));

        return fulfillWithValue({ device: portfolioTrackerDevice });
    },
);

export const confirmAddressOnDeviceThunk = createThunk(
    `${DEVICE_MODULE_PREFIX}/confirmAddressOnDeviceThunk`,
    async (
        {
            accountKey,
            addressPath,
            chunkify,
        }: { accountKey: AccountKey; addressPath: string; chunkify: boolean },
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

export const onPassphraseSubmit = createThunk(
    `${DEVICE_MODULE_PREFIX}/onPassphraseSubmit`,
    (
        { value, passphraseOnDevice }: { value: string; passphraseOnDevice: boolean },
        { dispatch, getState },
    ) => {
        const device = selectSelectedDevice(getState());
        if (!device) return;

        if (!device.state) {
            dispatch(
                deviceActions.updatePassphraseMode({
                    device,
                    hidden: passphraseOnDevice || !!value,
                    alwaysOnDevice: passphraseOnDevice,
                }),
            );
        }

        TrezorConnect.uiResponse({
            type: UI.RECEIVE_PASSPHRASE,
            payload: {
                value,
                save: true,
                passphraseOnDevice,
            },
        });
    },
);

type DeviceConnectThunkEventType = typeof DEVICE.CONNECT | typeof DEVICE.CONNECT_UNACQUIRED;

type DeviceConnectThunksParams = {
    type: DeviceConnectThunkEventType;
    device: Device;
};

export const deviceConnectThunks = createThunk<void, DeviceConnectThunksParams, void>(
    `${DEVICE_MODULE_PREFIX}/deviceConnectThunk`,
    ({ type, device }, { dispatch, getState, extra }) => {
        const settings = extra.selectors.selectSuiteSettings(getState());

        switch (type) {
            case DEVICE.CONNECT:
                dispatch(deviceActions.connectDevice({ device, settings }));
                break;
            case DEVICE.CONNECT_UNACQUIRED:
                dispatch(deviceActions.connectUnacquiredDevice({ device, settings }));
                break;
            default:
                exhaustive(type);
        }
    },
);

export const passwordMismatchResetThunk = createThunk<void, { device: TrezorDevice }, void>(
    `${DEVICE_MODULE_PREFIX}/passwordMismatchResetThunk`,
    ({ device }, { dispatch, getState, extra }) => {
        const settings = extra.selectors.selectSuiteSettings(getState());

        dispatch(deviceActions.forgetDevice({ device, settings }));
        const newDevice = selectSelectedDevice(getState());
        dispatch(deviceActions.selectDevice(newDevice));
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
            skipFinalReload: isBootloaderMode,
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

                const resultForget = await bluetoothIpc.forgetDevice(device.bluetoothProps.id);
                if (!resultForget.success) {
                    dispatch(
                        bluetoothActions.setBluetoothDeviceNeedsManualOsRemoval({
                            needsManualRemoval: true,
                        }),
                    );
                }
            }
            const newDevice = selectSelectedDevice(getState());
            const newDevices = selectDevices(getState());
            const settings = extra.selectors.selectSuiteSettings(getState());

            deviceInstances.push(...getDeviceInstances(newDevice!, newDevices));
            deviceInstances.forEach(d => {
                dispatch(deviceActions.forgetDevice({ device: d, settings }));
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
            rejectWithValue(result.payload.error);
        }
    },
);
