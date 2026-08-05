import { type AnalyticsDep } from '@suite-common/analytics';
import {
    type BluetoothDeviceCommon,
    type ForgetBluetoothDeviceDep,
    type WithBluetoothState,
    bluetoothActions,
    selectKnownDeviceByDeviceId,
} from '@suite-common/bluetooth';
import {
    DEVICE_MODULE_PREFIX,
    type DeviceRootState,
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
import {
    type FirmwareRootState,
    selectIsFirmwareInstallationRunning,
} from '@suite-common/firmware';
import { type FetchAndSaveMetadataDep } from '@suite-common/metadata-types';
import { createThunk } from '@suite-common/redux-utils';
import {
    type AcquiredDevice,
    type OpenModalDep,
    type TrezorDevice,
} from '@suite-common/suite-types';
import {
    getDeviceInstances,
    getFirstDeviceInstance,
    getIsDeviceBecomingAcquired,
    getIsDeviceBecomingConnected,
    getIsThpDevice,
    getSelectedDevice,
} from '@suite-common/suite-utils';
import { removeThpCredentialsThunk } from '@suite-common/thp';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type AccountKey, type GetTradedAccountKeysDep } from '@suite-common/wallet-types';
import {
    getAddressParameters,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
} from '@suite-common/wallet-utils';
import TrezorConnect, {
    type Address,
    type CardanoAddress,
    type Response as ConnectResponse,
    DEVICE,
    type Device,
    asBluetoothDeviceId,
} from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';
import { isChanged } from '@trezor/utils';

import { getAddressForNetworkType } from './deviceAddressUtils';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { selectAccountByKey } from '../accounts/accountsSelectors';
import { type RunDiscoveryThunkState, startDiscoveryThunk } from '../discovery/discoveryThunks';
import { selectDeviceThunk, selectNewlyConnectedDeviceThunk } from '../discovery/selectDeviceThunk';
import { setAutoEjectEnabled } from '../settings/walletSettingsActions';
import {
    type WalletSettingsRootState,
    selectIsDeviceAutoEjectEnabled,
} from '../settings/walletSettingsReducer';
type HandleDeviceDisconnectThunkState = DeviceRootState;

/**
 * Triggered by `@trezor/connect DEVICE_EVENT`
 * @param {Device} device
 */
export const handleDeviceDisconnect = createThunk<
    void,
    Device | TrezorDevice,
    { state: HandleDeviceDisconnectThunkState }
>(`${DEVICE_MODULE_PREFIX}/handleDeviceDisconnect`, (device, { dispatch, getState }) => {
    const selectedDevice = selectSelectedDevice(getState());
    if (!selectedDevice) return;
    if (selectedDevice.path !== device.path) return;

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
});

type ForgetDisconnectedDevicesThunkState = DeviceRootState;
type ForgetDisconnectedDevicesThunkParams = {
    device: Device | TrezorDevice;
    forceForget?: boolean;
};

/**
 * Triggered by `@trezor/connect DEVICE_EVENT` via suiteMiddleware
 * Remove all data related to all instances of disconnected device if they are not remembered
 * @param {Device} device
 */
export const forgetDisconnectedDevices = createThunk<
    void,
    ForgetDisconnectedDevicesThunkParams,
    { state: ForgetDisconnectedDevicesThunkState }
>(`${DEVICE_MODULE_PREFIX}/forgetDisconnectedDevices`, (params, { dispatch, getState }) => {
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
});

type ObserveSelectedDeviceResult = {
    isDeviceChanged: boolean;
    isDeviceBecomingAcquired: boolean;
    isDeviceBecomingConnected: boolean;
};
type ObserveSelectedDeviceThunkState = DeviceRootState;

/**
 * Keep selected device synchronized with the `devices` reducer, because selected device is a copy
 * of one of the `devices` (and those are updated via DEVICE.CHANGED. etc.).
 * Called from `suiteMiddleware` (Desktop) or `deviceMiddleware` (Mobile).
 */
export const observeSelectedDevice = createThunk<
    ObserveSelectedDeviceResult,
    void,
    { state: ObserveSelectedDeviceThunkState }
>(
    `${DEVICE_MODULE_PREFIX}/observeSelectedDevice`,
    (_, { dispatch, getState, fulfillWithValue }) => {
        const devices = selectDevices(getState());

        const selectedDevice = selectSelectedDevice(getState());
        if (!selectedDevice)
            return fulfillWithValue({
                isDeviceChanged: false,
                isDeviceBecomingAcquired: false,
                isDeviceBecomingConnected: false,
            });

        // Device in `devices` may have been already updated via DEVICE.CHANGED action
        const deviceFromReducer = getSelectedDevice(selectedDevice, devices);
        if (!deviceFromReducer)
            return fulfillWithValue({
                isDeviceChanged: true,
                isDeviceBecomingAcquired: false,
                isDeviceBecomingConnected: false,
            });

        const isDeviceChanged = isChanged(selectedDevice, deviceFromReducer);
        if (isDeviceChanged) {
            dispatch(deviceActions.updateSelectedDevice(deviceFromReducer));
        }

        // The "Is becoming acquired/connect" logic lives here, because currently we only care about
        // that for the selected device updates.
        // TBD: maybe this would be cleaner in connectInitThunk – if we care about all devices?
        const deviceComparison = { prevDevice: selectedDevice, nextDevice: deviceFromReducer };
        const isDeviceBecomingAcquired = getIsDeviceBecomingAcquired(deviceComparison);
        const isDeviceBecomingConnected = getIsDeviceBecomingConnected(deviceComparison);

        return fulfillWithValue({
            isDeviceChanged,
            isDeviceBecomingAcquired,
            isDeviceBecomingConnected,
        });
    },
);

/**
 * Called from <AcquireDevice /> component
 * Fetch device features without asking for pin/passphrase
 * this is the only place where useEmptyPassphrase should be always set to "true"
 */
type AcquireDeviceThunkParams = {
    requestedDevice?: TrezorDevice | null;
    startDiscovery?: boolean;
};
type AcquireDeviceThunkState = RunDiscoveryThunkState;
type AcquireDeviceThunkDeps = {
    services: AnalyticsDep & GetTradedAccountKeysDep;
    thunks: FetchAndSaveMetadataDep;
};

export const acquireDevice = createThunk<
    void,
    AcquireDeviceThunkParams,
    { state: AcquireDeviceThunkState; extra: AcquireDeviceThunkDeps }
>(
    `${DEVICE_MODULE_PREFIX}/acquireDevice`,
    async ({ requestedDevice, startDiscovery }, { dispatch, getState }) => {
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

type InitDevicesThunkState = DeviceRootState;

export const initDevices = createThunk<void, void, { state: InitDevicesThunkState }>(
    `${DEVICE_MODULE_PREFIX}/initDevices`,
    (_, { dispatch, getState }) => {
        const devices = selectDevices(getState());

        const device = selectSelectedDevice(getState());

        if (!device && devices?.[0]) {
            dispatch(selectDeviceThunk({ device: sortDevices(devices)[0] }));
        }
    },
);

type CreateImportedDeviceThunkState = DeviceRootState;

export const createImportedDeviceThunk = createThunk<
    void,
    undefined,
    {
        rejectValue: { error: 'already-created' };
        state: CreateImportedDeviceThunkState;
    }
>(`${DEVICE_MODULE_PREFIX}/createImportedDevice`, (_, { dispatch, getState, rejectWithValue }) => {
    if (selectDeviceById(getState(), PORTFOLIO_TRACKER_DEVICE_ID)) {
        return rejectWithValue({ error: 'already-created' });
    }

    dispatch(
        deviceActions.createDeviceInstance({
            device: portfolioTrackerDevice,
        }),
    );

    const selectedDevice = selectSelectedDevice(getState());

    if (selectedDevice === undefined) {
        dispatch(selectDeviceThunk({ device: portfolioTrackerDevice }));
    }
});

type ConfirmAddressOnDeviceThunk = {
    accountKey: AccountKey;
    addressPath: string;
    chunkify: boolean;
    showOnTrezor?: boolean;
};
type ConfirmAddressOnDeviceThunkState = AccountsRootState & DeviceRootState;

export const confirmAddressOnDeviceThunk = createThunk<
    ConnectResponse<Address | CardanoAddress>,
    ConfirmAddressOnDeviceThunk,
    { state: ConfirmAddressOnDeviceThunkState }
>(
    `${DEVICE_MODULE_PREFIX}/confirmAddressOnDeviceThunk`,
    async (
        { accountKey, addressPath, chunkify, showOnTrezor = true },
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

        return await getAddressForNetworkType({
            device,
            networkType: account.networkType,
            path: addressPath,
            unlockPath: account.unlockPath,
            coin: account.symbol,
            chunkify,
            showOnTrezor,
            cardano: {
                addressParameters: getAddressParameters(account, addressPath),
                protocolMagic: getProtocolMagic(account.symbol),
                networkId: getNetworkId(),
                derivationType: getDerivationType(account.accountType),
            },
        });
    },
);

type DeviceConnectThunkEventType = typeof DEVICE.CONNECT | typeof DEVICE.CONNECT_UNACQUIRED;

type DeviceConnectThunksParams = {
    type: DeviceConnectThunkEventType;
    device: Device;
};

export type DeviceConnectThunkDeps = {
    services: AnalyticsDep & GetTradedAccountKeysDep;
    thunks: FetchAndSaveMetadataDep;
};

export type DeviceConnectThunkState = FirmwareRootState & RunDiscoveryThunkState;

export const deviceConnectThunks = createThunk<
    void,
    DeviceConnectThunksParams,
    { state: DeviceConnectThunkState; extra: DeviceConnectThunkDeps }
>(`${DEVICE_MODULE_PREFIX}/deviceConnectThunk`, ({ type, device }, { dispatch, getState }) => {
    // TODO (THP phase): Using selectIsFirmwareInstallationRunning = (hidden) circular dependency.
    const isFwInstallation = selectIsFirmwareInstallationRunning(getState());
    switch (type) {
        case DEVICE.CONNECT:
            dispatch(deviceActions.connectDevice({ device }));
            dispatch(selectNewlyConnectedDeviceThunk({ device }));
            break;
        case DEVICE.CONNECT_UNACQUIRED:
            dispatch(deviceActions.connectUnacquiredDevice({ device }));
            if (getIsThpDevice(device) && !isFwInstallation) {
                // This needs to be re-selected to convert Device to TrezorDevice.
                const requestedDevice = selectDevices(getState()).find(d => d.path === device.path);
                dispatch(acquireDevice({ requestedDevice }));
            }
            dispatch(selectNewlyConnectedDeviceThunk({ device }));
            break;
        default:
            exhaustive(type);
    }
});

type SetDeviceAutoEjectThunkParams = {
    shouldEnable: boolean;
};
type SetDeviceAutoEjectThunkState = DeviceRootState & WalletSettingsRootState;

export const setDeviceAutoEjectThunk = createThunk<
    void,
    SetDeviceAutoEjectThunkParams,
    { state: SetDeviceAutoEjectThunkState }
>(`${DEVICE_MODULE_PREFIX}/setDeviceAutoEjectThunk`, ({ shouldEnable }, { dispatch, getState }) => {
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
});

type ToggleAutoEjectThunkState = DeviceRootState & WalletSettingsRootState;

export const toggleAutoEjectThunk = createThunk<
    unknown,
    void,
    { state: ToggleAutoEjectThunkState }
>(`${DEVICE_MODULE_PREFIX}/toggleAutoEjectThunk`, (_, { dispatch, getState }) =>
    dispatch(
        setDeviceAutoEjectThunk({
            shouldEnable: !selectIsDeviceAutoEjectEnabled(getState()),
        }),
    ),
);

type ForgetDevicePersistentDataThunkParams = {
    deviceId: TrezorDevice['id'];
    isOsUnpairingFinished?: boolean;
    skipToggleModalConnection?: boolean;
    skipDisconnect?: boolean;
};

/**
 * This thunk is the central place to remove all persistent data related to a device_id.
 * This includes wallets, `persistentDeviceData`, Bluetooth, THP.
 * But not wallets, see `forgetDevice` (ejecting wallets & forgetting the rest are separate features).
 */
export type ForgetDevicePersistentDataThunkDeps = {
    thunks: ForgetBluetoothDeviceDep;
};
export type ForgetDevicePersistentDataThunkState = DeviceRootState &
    WithBluetoothState<BluetoothDeviceCommon>;

export const forgetDevicePersistentDataThunk = createThunk<
    void,
    ForgetDevicePersistentDataThunkParams,
    {
        state: ForgetDevicePersistentDataThunkState;
        extra: ForgetDevicePersistentDataThunkDeps;
    }
>(
    `${DEVICE_MODULE_PREFIX}/forgetSingleDevicePersistentDataThunk`,
    async (
        { deviceId, skipToggleModalConnection, isOsUnpairingFinished, skipDisconnect },
        { dispatch, extra, getState },
    ) => {
        if (!deviceId) return;

        const device = selectDeviceById(getState(), deviceId);
        const matchingDevice = selectPersistentDeviceDataById(getState(), deviceId);

        dispatch(deviceActions.forgetDevicePersistentData({ deviceId }));

        const bluetoothId =
            matchingDevice?.descriptor?.apiType === 'bluetooth' && matchingDevice.descriptor.id
                ? asBluetoothDeviceId(matchingDevice.descriptor.id)
                : undefined;

        // Also check for a known BT device by trezor device ID.
        // The device may have been paired via BT previously but is now
        // connected via USB — the persistent descriptor won't be 'bluetooth'.
        const knownBtDevice = selectKnownDeviceByDeviceId(getState(), deviceId);
        const btIdToRemove =
            bluetoothId ?? (knownBtDevice ? asBluetoothDeviceId(knownBtDevice.id) : undefined);

        if (btIdToRemove !== undefined) {
            dispatch(bluetoothActions.removeKnownDeviceAction({ id: btIdToRemove }));
            // try to remove OS-level Bluetooth bonds, if supported by the platform
            await dispatch(
                extra.thunks.forgetBluetoothDevice({
                    bluetoothId: btIdToRemove,
                    skipToggleModalConnection,
                    isOsUnpairingFinished,
                    skipDisconnect,
                }),
            );
        }
        const credentials = matchingDevice?.thp?.credentials;
        if (credentials !== undefined) {
            await dispatch(removeThpCredentialsThunk({ device, credentials })).unwrap();
        }
    },
);

export type ForgetDeviceThunkParams = {
    isOsUnpairingFinished?: boolean;
    skipToggleModalConnection?: boolean;
    skipDisconnect?: boolean;
    deviceId?: TrezorDevice['id'];
};
type ForgetDeviceThunkState = ForgetDevicePersistentDataThunkState;
type ForgetDeviceThunkDeps = {
    thunks: ForgetBluetoothDeviceDep;
};

export const forgetDeviceThunk = createThunk<
    void,
    ForgetDeviceThunkParams | undefined,
    {
        state: ForgetDeviceThunkState;
        extra: ForgetDeviceThunkDeps;
    }
>(
    `${DEVICE_MODULE_PREFIX}/forgetDevice`,
    async (
        { skipToggleModalConnection, isOsUnpairingFinished, skipDisconnect, deviceId } = {},
        { dispatch, getState },
    ) => {
        const devices = selectDevices(getState());

        const explicitDevice = deviceId
            ? devices.find(candidateDevice => candidateDevice.id === deviceId)
            : undefined;
        const device = explicitDevice ?? selectSelectedDevice(getState());
        if (!device) return;

        const deviceInstances = getDeviceInstances(device, devices);

        await dispatch(
            forgetDevicePersistentDataThunk({
                deviceId: device.id,
                skipToggleModalConnection,
                isOsUnpairingFinished,
                skipDisconnect,
            }),
        );

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
type HandlePostWipeCleanupThunkParams = {
    initialDevice: TrezorDevice;
    deviceInstances: AcquiredDevice[];
};
type HandlePostWipeCleanupThunkDeps = {
    actions: OpenModalDep;
    thunks: ForgetBluetoothDeviceDep;
};
type HandlePostWipeCleanupThunkState = ForgetDevicePersistentDataThunkState;

const handlePostWipeCleanupThunk = createThunk<
    void,
    HandlePostWipeCleanupThunkParams,
    {
        state: HandlePostWipeCleanupThunkState;
        extra: HandlePostWipeCleanupThunkDeps;
    }
>(
    `${DEVICE_MODULE_PREFIX}/handlePostWipeCleanup`,
    async ({ initialDevice, deviceInstances }, { dispatch, getState, extra }) => {
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
            await dispatch(forgetDevicePersistentDataThunk({ deviceId: initialDevice.id }));
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

type DeviceWipedFromDeviceThunkState = ForgetDevicePersistentDataThunkState;
type DeviceWipedFromDeviceThunkDeps = {
    thunks: ForgetBluetoothDeviceDep;
    actions: OpenModalDep;
};

export const deviceWipedFromDeviceThunk = createThunk<
    void,
    void,
    {
        state: DeviceWipedFromDeviceThunkState;
        extra: DeviceWipedFromDeviceThunkDeps;
    }
>(`${DEVICE_MODULE_PREFIX}/deviceWipedFromDeviceThunk`, (_, { dispatch, getState }) => {
    const device = selectSelectedDevice(getState());
    if (!device) return;
    const devices = selectDevices(getState());
    // collect devices with old "device.id" to be removed (see description below)
    const deviceInstances = getDeviceInstances(device, devices);

    // Successful wipe happened on the device itself, so we just run the cleanup.
    dispatch(handlePostWipeCleanupThunk({ initialDevice: device, deviceInstances }));
});

type WipeDeviceThunkState = ForgetDevicePersistentDataThunkState;
type WipeDeviceThunkDeps = {
    thunks: ForgetBluetoothDeviceDep;
    actions: OpenModalDep;
};

export const wipeDeviceThunk = createThunk<
    void,
    void,
    {
        state: WipeDeviceThunkState;
        extra: WipeDeviceThunkDeps;
        rejectValue: string;
    }
>(`${DEVICE_MODULE_PREFIX}/wipeDevice`, async (_, { dispatch, getState, rejectWithValue }) => {
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
        (device.descriptor.apiType === 'bluetooth' && result.error.code === 'Device_Disconnected')
    ) {
        // The wipe was successful, now run the shared cleanup logic.
        // We pass the original `device` object to the cleanup thunk.
        dispatch(handlePostWipeCleanupThunk({ initialDevice: device, deviceInstances }));
    } else {
        dispatch(notificationsActions.addToast({ type: 'error', error: result.error.message }));

        return rejectWithValue(result.error.message);
    }
});
