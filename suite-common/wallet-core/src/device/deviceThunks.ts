import { bluetoothActions } from '@suite-common/bluetooth';
import {
    DEVICE_MODULE_PREFIX,
    PORTFOLIO_TRACKER_DEVICE_ID,
    deviceActions,
    portfolioTrackerDevice,
    selectDeviceById,
    selectDevices,
    selectPersistentDeviceDataById,
    selectPhysicalDeviceWallets,
    selectSelectedDevice,
    shouldDeviceBeRemembered,
    sortDevices,
} from '@suite-common/device';
import { selectIsFirmwareInstallationRunning } from '@suite-common/firmware';
import { createThunk } from '@suite-common/redux-utils';
import { type AcquiredDevice, type TrezorDevice } from '@suite-common/suite-types';
import {
    getDeviceInstances,
    getFirstDeviceInstance,
    getIsThpDevice,
    getSelectedDevice,
} from '@suite-common/suite-utils';
import { removeThpCredentialsThunk } from '@suite-common/thp';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    getAddressType,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
} from '@suite-common/wallet-utils';
import TrezorConnect, {
    type Address,
    type CardanoAddress,
    type Response as ConnectResponse,
    DEVICE,
    type Device,
    asBluetoothDeviceId,
} from '@trezor/connect';
import { getEnvironment } from '@trezor/env-utils';
import { exhaustive } from '@trezor/type-utils';
import { isChanged } from '@trezor/utils';

import { selectAccountByKey } from '../accounts/accountsSelectors';
import { startDiscoveryThunk } from '../discovery/discoveryThunks';
import { selectDeviceThunk, selectNewlyConnectedDeviceThunk } from '../discovery/selectDeviceThunk';
import { setAutoEjectEnabled } from '../settings/walletSettingsActions';
import { selectIsDeviceAutoEjectEnabled } from '../settings/walletSettingsReducer';

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
        if (!selectedDevice) return;
        if (selectedDevice.path !== device.path) return;

        const routerApp = selectRouterApp(getState());

        /**
         * Under normal circumstances, after device is disconnected we want suite to select another existing device (either remembered or physically connected)
         * This is not the case in firmware update and onboarding; In this case we simply wan't suite.device to be empty until user reconnects a device again
         */
        if (['onboarding', 'firmware', 'firmware-type'].includes(routerApp)) {
            dispatch(selectDeviceThunk({ device: undefined }));

            return;
        }

        const devices = selectDevices(getState());

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

        const response = await TrezorConnect.getFeatures({ device });

        if (!response.success) {
            if (response.error.code !== 'Device_ThpPairingTagInvalid') {
                dispatch(
                    notificationsActions.addToast({
                        type: 'acquire-error',
                        device,
                        error: response.error.message,
                    }),
                );
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

export const initDevices = createThunk(
    `${DEVICE_MODULE_PREFIX}/initDevices`,
    (_, { dispatch, getState }) => {
        const devices = selectDevices(getState());

        const device = selectSelectedDevice(getState());

        if (!device && devices?.[0]) {
            dispatch(selectDeviceThunk({ device: sortDevices(devices)[0] }));
        }
    },
);

export const createImportedDeviceThunk = createThunk<
    void,
    undefined,
    { rejectValue: { error: 'already-created' } }
>(`${DEVICE_MODULE_PREFIX}/createImportedDevice`, (_, { dispatch, getState, rejectWithValue }) => {
    const device = selectDeviceById(getState(), PORTFOLIO_TRACKER_DEVICE_ID);

    if (device) return rejectWithValue({ error: 'already-created' });

    dispatch(
        deviceActions.createDeviceInstance({
            device: portfolioTrackerDevice,
        }),
    );

    dispatch(selectDeviceThunk({ device: portfolioTrackerDevice }));
});

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
                error: {
                    message: 'Device or account does not exist.',
                    code: 'Failure_UnknownCode',
                },
            };

        const params = {
            device,
            path: addressPath,
            unlockPath: account.unlockPath,
            coin: account.symbol,
            chunkify,
            showOnTrezor,
        };

        let response;

        const isCardanoAddressChunked = getEnvironment() === 'mobile';

        switch (account.networkType) {
            case 'tron':
                response = await TrezorConnect.tronGetAddress(params);
                break;
            case 'ethereum':
                response = await TrezorConnect.ethereumGetAddress(params);
                break;
            case 'cardano':
                response = TrezorConnect.cardanoGetAddress({
                    device,
                    addressParameters: {
                        stakingPath: getStakingPath(account),
                        addressType: getAddressType(),
                        path: addressPath,
                    },
                    protocolMagic: getProtocolMagic(account.symbol),
                    networkId: getNetworkId(),
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
                    error: {
                        message: 'Method for getAddress not defined',
                        code: 'Failure_UnknownCode',
                    },
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
    ({ type, device }, { dispatch, getState }) => {
        const isAutoEjectEnabled = selectIsDeviceAutoEjectEnabled(getState());
        // TODO (THP phase): Using selectIsFirmwareInstallationRunning = (hidden) circular dependency.
        const isFwInstallation = selectIsFirmwareInstallationRunning(getState());
        switch (type) {
            case DEVICE.CONNECT:
                dispatch(
                    deviceActions.connectDevice({
                        device,
                        isAutoEjectEnabled,
                    }),
                );
                dispatch(selectNewlyConnectedDeviceThunk({ device }));
                break;
            case DEVICE.CONNECT_UNACQUIRED:
                dispatch(
                    deviceActions.connectUnacquiredDevice({
                        device,
                        isAutoEjectEnabled,
                    }),
                );
                if (getIsThpDevice(device) && !isFwInstallation) {
                    // This needs to be re-selected to convert Device to TrezorDevice.
                    const requestedDevice = selectDevices(getState()).find(
                        d => d.path === device.path,
                    );
                    dispatch(acquireDevice({ requestedDevice }));
                }
                dispatch(selectNewlyConnectedDeviceThunk({ device }));
                break;
            default:
                exhaustive(type);
        }
    },
);

type SetDeviceAutoEjectThunkParams = {
    shouldEnable: boolean;
};

export const setDeviceAutoEjectThunk = createThunk(
    `${DEVICE_MODULE_PREFIX}/setDeviceAutoEjectThunk`,
    ({ shouldEnable }: SetDeviceAutoEjectThunkParams, { dispatch, getState }) => {
        const isEnabled = selectIsDeviceAutoEjectEnabled(getState());

        if (isEnabled === shouldEnable) {
            return;
        }

        dispatch(setAutoEjectEnabled(shouldEnable));

        const physicalDeviceWallets = selectPhysicalDeviceWallets(getState());
        physicalDeviceWallets.forEach(wallet => {
            const shouldRemember = shouldDeviceBeRemembered({
                isAutoEjectEnabled: shouldEnable,
                device: wallet,
            });

            if (wallet.remember === shouldRemember) {
                return;
            }

            dispatch(
                deviceActions.setRememberDevice({
                    device: wallet,
                    remember: shouldRemember,
                }),
            );

            if (shouldEnable && !wallet.connected) {
                dispatch(forgetDisconnectedDevices({ device: wallet, forceForget: true }));
            }
        });
    },
);

export const toggleAutoEjectThunk = createThunk(
    `${DEVICE_MODULE_PREFIX}/toggleAutoEjectThunk`,
    (_, { dispatch, getState }) =>
        dispatch(
            setDeviceAutoEjectThunk({
                shouldEnable: !selectIsDeviceAutoEjectEnabled(getState()),
            }),
        ),
);

type ForgetAllDeviceDataThunkParams = {
    deviceId: TrezorDevice['id'];
};

/**
 * This thunk is the central place to remove all persistent data related to a device_id.
 * This includes wallets, `persistentDeviceData`, Bluetooth, THP.
 * But not wallets, see `forgetDevice` (ejecting wallets & forgetting the rest are separate features).
 */
export const forgetSingleDevicePersistentDataThunk = createThunk(
    `${DEVICE_MODULE_PREFIX}/forgetSingleDevicePersistentDataThunk`,
    async ({ deviceId }: ForgetAllDeviceDataThunkParams, { dispatch, extra, getState }) => {
        if (!deviceId) return;

        const device = selectDeviceById(getState(), deviceId);
        const matchingDevice = selectPersistentDeviceDataById(getState(), deviceId);

        dispatch(deviceActions.forgetDevicePersistentData({ deviceId }));

        const bluetoothId =
            matchingDevice?.descriptor?.apiType === 'bluetooth' && matchingDevice.descriptor.id
                ? asBluetoothDeviceId(matchingDevice.descriptor.id)
                : undefined;
        if (bluetoothId !== undefined) {
            dispatch(bluetoothActions.removeKnownDeviceAction({ id: bluetoothId }));
            // try to remove OS-level Bluetooth bonds, if supported by the platform
            await dispatch(extra.thunks.forgetBluetoothDevice({ bluetoothId }));
        }
        const credentials = matchingDevice?.thp?.credentials;
        if (credentials !== undefined) {
            await dispatch(removeThpCredentialsThunk({ device, credentials })).unwrap();
        }
    },
);

export const forgetDeviceThunk = createThunk(
    `${DEVICE_MODULE_PREFIX}/forgetDevice`,
    async (_, { dispatch, getState }) => {
        const device = selectSelectedDevice(getState());
        if (!device) return;

        const devices = selectDevices(getState());
        const deviceInstances = getDeviceInstances(device, devices);

        await dispatch(forgetSingleDevicePersistentDataThunk({ deviceId: device.id }));

        deviceInstances.forEach(instance => {
            dispatch(deviceActions.forgetDevice({ device: instance }));
        });
    },
);

/**
 * Handles the necessary cleanup after a device has been wiped.
 * This includes forgetting old/new device instances, clearing persistent data,
 * showing a success toast, and requesting a reconnect.
 */
const handlePostWipeCleanupThunk = createThunk(
    `${DEVICE_MODULE_PREFIX}/handlePostWipeCleanup`,
    async (
        {
            initialDevice,
            deviceInstances,
        }: {
            initialDevice: TrezorDevice;
            deviceInstances: AcquiredDevice[];
        },
        { dispatch, getState, extra },
    ) => {
        // Wiping a device triggers device.id change, and this change is propagated to device reducer via @trezor/connect DEVICE.CHANGE event.
        // Accounts data are related to the old device.id; to properly clear reducers and indexed db,
        // we need to retrieve device objects BEFORE and AFTER the wipe process.
        // And call SUITE.FORGET_DEVICE on ALL devices (with old and new device.id)
        const newDevice = selectSelectedDevice(getState());
        const newDevices = selectDevices(getState());

        deviceInstances.push(...getDeviceInstances(newDevice!, newDevices));
        deviceInstances.forEach(d => {
            dispatch(deviceActions.forgetDevice({ device: d }));
        });

        if (initialDevice.id !== undefined) {
            // Wiping a device changes bluetoothId and THP static key, so wipe BT known device & THP credentials
            // (and persistent device data as well, because device.id changed).
            await dispatch(forgetSingleDevicePersistentDataThunk({ deviceId: initialDevice.id }));
        }

        dispatch(extra.actions.openModal({ type: 'wipe-device-success' }));

        // Special case with webusb: Device after wipe changes device_id. With webusb transport, device_id is used as a path
        // and thus as a descriptor for webusb. So, after the device is wiped, in the transport layer, the device is still paired
        // through the old descriptor, but suite already works with a new one. It kinda works, but only until we try a new call,
        // typically resetDevice when in onboarding - we get a device-disconnected error.
        //
        // Edit 1: disconnecting the device wiped from bootloader mode is also necessary.
        // Edit 2: encountered libusb error with bridge 2.0.27. So let's enforce disconnecting for all devices.
        dispatch(deviceActions.requestDeviceReconnect());
    },
);

export const deviceWipedFromDeviceThunk = createThunk(
    `${DEVICE_MODULE_PREFIX}/deviceWipedFromDeviceThunk`,
    (_, { dispatch, getState }) => {
        const device = selectSelectedDevice(getState());
        if (!device) return;
        const devices = selectDevices(getState());
        // collect devices with old "device.id" to be removed (see description below)
        const deviceInstances = getDeviceInstances(device, devices);

        // Successful wipe happened on the device itself, so we just run the cleanup.
        dispatch(handlePostWipeCleanupThunk({ initialDevice: device, deviceInstances }));
    },
);

export const wipeDeviceThunk = createThunk(
    `${DEVICE_MODULE_PREFIX}/wipeDevice`,
    async (_, { dispatch, getState, rejectWithValue }) => {
        const device = selectSelectedDevice(getState());
        if (!device) return;

        const devices = selectDevices(getState());
        // collect devices with old "device.id" to be removed (see description below)
        const deviceInstances = getDeviceInstances(device, devices);

        const result = await TrezorConnect.wipeDevice({
            device: { path: device.path },
        });

        if (
            result.success ||
            // This is an expected success for Bluetooth-connected devices
            (device.descriptor.apiType === 'bluetooth' &&
                result.error.code === 'Device_Disconnected')
        ) {
            // The wipe was successful, now run the shared cleanup logic.
            // We pass the original `device` object to the cleanup thunk.
            dispatch(handlePostWipeCleanupThunk({ initialDevice: device, deviceInstances }));
        } else {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.error.message }));

            return rejectWithValue(result.error.message);
        }
    },
);
