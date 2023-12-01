import { memoize } from 'proxy-memoize';

import * as deviceUtils from '@suite-common/suite-utils';
import { getStatus } from '@suite-common/suite-utils';
import { Device, Features } from '@trezor/connect';
import { getFirmwareVersion, getFirmwareVersionArray } from '@trezor/device-utils';
import { Network, networks } from '@suite-common/wallet-config';
import { versionUtils } from '@trezor/utils';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { TrezorDevice, AcquiredDevice, ButtonRequest } from '@suite-common/suite-types';
import {
    deviceAuthenticityActions,
    StoredAuthenticateDeviceResult,
} from '@suite-common/device-authenticity';

import { deviceActions } from './deviceActions';
import { PORTFOLIO_TRACKER_DEVICE_ID, PORTFOLIO_TRACKER_DEVICE_STATE } from './deviceConstants';

export type State = {
    devices: TrezorDevice[];
    selectedDevice?: TrezorDevice;
    deviceAuthenticity?: Record<string, StoredAuthenticateDeviceResult>;
};

const initialState: State = { devices: [], selectedDevice: undefined };

export type DeviceRootState = {
    device: {
        devices: TrezorDevice[];
        selectedDevice?: TrezorDevice;
        deviceAuthenticity?: State['deviceAuthenticity'];
    };
};

// Use the negated form as it better fits the call sites.
// Export to be testeable.
/** Returns true if device with given Features is not locked. */
export const isUnlocked = (features: Features): boolean =>
    typeof features.unlocked === 'boolean'
        ? features.unlocked
        : // Older FW (<2.3.2) which doesn't have `unlocked` feature also doesn't have auto-lock and is always unlocked.
          true;

/**
 * Local utility: set updated fields for device
 * @param {AcquiredDevice} device
 * @param {Partial<AcquiredDevice>} upcoming
 * @returns {TrezorDevice}
 */
const merge = (device: AcquiredDevice, upcoming: Partial<AcquiredDevice>): TrezorDevice => ({
    ...device,
    ...upcoming,
    id: upcoming.id ?? device.id,
    state: device.state,
    instance: device.instance,
    features: {
        // Don't override features if upcoming device is locked.
        // In such case the features are redacted i.e. all fields are `null`
        // but we still want to remember what the features are...
        ...(upcoming.features && isUnlocked(upcoming.features)
            ? upcoming.features
            : device.features),
        // ...except for `unlocked` and `busy` which should reflect the actual state of the device.
        unlocked: upcoming.features ? upcoming.features.unlocked : null,
        busy: upcoming.features?.busy,
    },
});

/**
 * Action handler: DEVICE.CONNECT + DEVICE.CONNECT_UNACQUIRED
 * @param {State} draft
 * @param {Device} device
 * @returns
 */
const connectDevice = (draft: State, device: Device) => {
    // connected device is unacquired/unreadable
    if (!device.features) {
        // check if device already exists in reducer
        const unacquiredDevices = draft.devices.filter(d => d.path === device.path);
        if (unacquiredDevices.length > 0) {
            // and ignore this action if so
            return;
        }
        draft.devices.push({
            ...device,
            connected: true,
            available: false,
            useEmptyPassphrase: true,
            buttonRequests: [],
            metadata: {},
            ts: new Date().getTime(),
        });
        return;
    }

    const { features } = device;
    // find affected devices with current "device_id" (acquired only)
    const affectedDevices = draft.devices.filter(
        d => d.features && d.id === device.id,
    ) as AcquiredDevice[];
    // find unacquired device with current "path" (unacquired device will become acquired)
    const unacquiredDevices = draft.devices.filter(
        d => d.path.length > 0 && d.path === device.path,
    );
    // get not affected devices
    // and exclude unacquired devices with current "device_id" (they will become acquired)
    const otherDevices: TrezorDevice[] = draft.devices.filter(
        d => affectedDevices.indexOf(d as AcquiredDevice) < 0 && unacquiredDevices.indexOf(d) < 0,
    );

    // clear draft
    draft.devices.splice(0, draft.devices.length);
    // fill draft with not affected devices
    otherDevices.forEach(d => draft.devices.push(d));

    // prepare new device
    const newDevice: TrezorDevice = {
        ...device,
        useEmptyPassphrase: isUnlocked(device.features) && !features.passphrase_protection,
        remember: false,
        connected: true,
        available: true,
        authConfirm: false,
        instance: features.passphrase_protection
            ? deviceUtils.getNewInstanceNumber(draft.devices, device) || 1
            : undefined,
        buttonRequests: [],
        metadata: {},
        ts: new Date().getTime(),
    };

    // update affected devices
    if (affectedDevices.length > 0) {
        const changedDevices = affectedDevices.map(d => {
            // change availability according to "passphrase_protection" field
            if (
                !d.useEmptyPassphrase &&
                isUnlocked(device.features) &&
                !features.passphrase_protection
            ) {
                return merge(d, { ...device, connected: true, available: false });
            }
            return merge(d, { ...device, connected: true, available: true });
        });

        // affected device with current "passphrase_protection" does not exists
        // basically it means that the "standard" device without "useEmptyPassphrase" was forgotten or never created (removed from reducer)
        // automatically create new "standard" instance
        if (!changedDevices.find(d => d.available)) {
            changedDevices.push(newDevice);
        }
        // fill draft with affectedDevices values
        changedDevices.forEach(d => draft.devices.push(d));
    } else {
        // add new device
        draft.devices.push(newDevice);
    }
};

/**
 * Action handler: DEVICE.CHANGED
 * @param {State} draft
 * @param {(Device | TrezorDevice)} device
 * @param {Partial<AcquiredDevice>} [extended]
 * @returns
 */
const changeDevice = (
    draft: State,
    device: Device | TrezorDevice,
    extended?: Partial<AcquiredDevice>,
) => {
    // change only acquired devices
    if (!device.features) return;

    // find devices with the same "device_id"
    const affectedDevices = draft.devices.filter(
        d =>
            d.features &&
            ((d.connected &&
                (d.id === device.id || (d.path.length > 0 && d.path === device.path))) ||
                // update "disconnected" remembered devices if in bootloader mode
                (d.mode === 'bootloader' && d.remember && d.id === device.id)),
    ) as AcquiredDevice[];

    const otherDevices = draft.devices.filter(
        d => affectedDevices.indexOf(d as AcquiredDevice) === -1,
    );
    // clear draft
    draft.devices.splice(0, draft.devices.length);
    // fill draft with not affected devices
    otherDevices.forEach(d => draft.devices.push(d));

    if (affectedDevices.length > 0) {
        const isDeviceUnlocked = isUnlocked(device.features);
        // merge incoming device with State
        const changedDevices = affectedDevices.map(d => {
            if (d.state && isDeviceUnlocked) {
                // if device is unlocked and authorized (with state) check availability.
                // if it was created with passphrase (useEmptyPassphrase = false) then availability depends on current settings
                const available = d.useEmptyPassphrase
                    ? true
                    : !!device.features.passphrase_protection;
                return merge(d, { ...device, ...extended, available });
            }
            if (
                !d.state &&
                !device.features.passphrase_protection &&
                !isUnlocked(d.features) &&
                isDeviceUnlocked
            ) {
                // if device with passhprase disabled is not authorized (no state) and becomes unlocked update useEmptyPassphrase field (hidden/standard wallet)
                return merge(d, {
                    ...device,
                    ...extended,
                    available: true,
                    useEmptyPassphrase: true, // device with disabled passphrase_protection can have only standard wallet
                });
            }
            return merge(d, { ...device, ...extended });
        });
        // fill draft with affectedDevices values
        changedDevices.forEach(d => draft.devices.push(d));
    }
};

/**
 * Action handler: DEVICE.DISCONNECT
 * @param {State} draft
 * @param {Device} device
 */
const disconnectDevice = (draft: State, device: Device) => {
    // find all devices with "path"
    const affectedDevices = draft.devices.filter(d => d.path === device.path);
    affectedDevices.forEach(d => {
        // do not remove devices with state, they are potential candidates to remember if not remembered already
        const skip = d.features && d.remember;
        if (skip) {
            d.connected = false;
            d.available = false;
            d.path = '';
        } else {
            draft.devices.splice(draft.devices.indexOf(d), 1);
        }
    });
};

/**
 * Action handler: SUITE.SELECT_DEVICE
 * @param {State} draft
 * @param {TrezorDevice} [device]
 * @returns
 */
const updateTimestamp = (draft: State, device?: TrezorDevice) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft.devices, device);
    if (!draft.devices[index]) return;
    // update timestamp
    draft.devices[index].ts = new Date().getTime();
};

/**
 * Action handler: SUITE.RECEIVE_PASSPHRASE_MODE + SUITE.UPDATE_PASSPHRASE_MODE
 * @param {State} draft
 * @param {TrezorDevice} device
 * @param {boolean} hidden
 * @param {boolean} [alwaysOnDevice=false]
 * @returns
 */
const changePassphraseMode = (
    draft: State,
    device: TrezorDevice,
    hidden: boolean,
    alwaysOnDevice = false,
) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft.devices, device);
    if (!draft.devices[index]) return;
    // update fields
    draft.devices[index].useEmptyPassphrase = !hidden;
    draft.devices[index].passphraseOnDevice = alwaysOnDevice;
    draft.devices[index].ts = new Date().getTime();
    if (hidden && typeof draft.devices[index].walletNumber !== 'number') {
        draft.devices[index].walletNumber = deviceUtils.getNewWalletNumber(
            draft.devices,
            draft.devices[index],
        );
    }
    if (!hidden && typeof draft.devices[index].walletNumber === 'number') {
        delete draft.devices[index].walletNumber;
    }
};

/**
 * Action handler: SUITE.AUTH_DEVICE
 * @param {State} draft
 * @param {TrezorDevice} device
 * @param {string} state
 * @returns
 */
const authDevice = (draft: State, device: TrezorDevice, state: string) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft.devices, device);
    if (!draft.devices[index]) return;
    // update state
    draft.devices[index].state = state;
    delete draft.devices[index].authFailed;
};

/**
 * Action handler: SUITE.AUTH_FAILED
 * @param {State} draft
 * @param {TrezorDevice} device
 * @returns
 */
const authFailed = (draft: State, device: TrezorDevice) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft.devices, device);
    if (!draft.devices[index]) return;
    draft.devices[index].authFailed = true;
};

/**
 * Action handler: SUITE.RECEIVE_AUTH_CONFIRM
 * @param {State} draft
 * @param {TrezorDevice} device
 * @param {boolean} success
 * @returns
 */
const authConfirm = (draft: State, device: TrezorDevice, success: boolean) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft.devices, device);
    if (!draft.devices[index]) return;
    // update state
    draft.devices[index].authConfirm = !success;
    draft.devices[index].available = success;
};

/**
 * Action handler: SUITE.CREATE_DEVICE_INSTANCE
 * @param {State} draft
 * @param {TrezorDevice} device
 * @returns
 */
const createInstance = (draft: State, device: TrezorDevice) => {
    // only acquired devices
    if (!device || !device.features) return;

    const isPortfolioTrackerDevice = device.id === PORTFOLIO_TRACKER_DEVICE_ID;

    const newDevice: TrezorDevice = {
        ...device,
        passphraseOnDevice: false,
        remember: false,
        // In mobile app, we need to keep device state defined by the constant
        // to be able to filter device accounts for portfolio tracker
        state: isPortfolioTrackerDevice ? device.state : undefined,
        walletNumber: undefined,
        authConfirm: false,
        ts: new Date().getTime(),
        buttonRequests: [],
        metadata: {},
    };
    draft.devices.push(newDevice);
};

/**
 * Action handler: SUITE.REMEMBER_DEVICE
 * Set `remember` field for a single device instance
 * @param {State} draft
 * @param {TrezorDevice} device
 * @param {boolean} remember
 */
const remember = (
    draft: State,
    device: TrezorDevice,
    shouldRemember: boolean,
    forceRemember?: true,
) => {
    // only acquired devices
    if (!device || !device.features) return;
    draft.devices.forEach(d => {
        if (deviceUtils.isSelectedInstance(device, d)) {
            d.remember = shouldRemember;
            if (forceRemember) d.forceRemember = true;
            else delete d.forceRemember;
        }
    });
};

/**
 * Action handler: SUITE.FORGET_DEVICE
 * Remove all device instances
 * @param {State} draft
 * @param {TrezorDevice} device
 * @returns
 */
const forget = (draft: State, device: TrezorDevice) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft.devices, device);
    if (!draft.devices[index]) return;
    const others = deviceUtils.getDeviceInstances(device, draft.devices, true);
    if (device.connected && others.length < 1) {
        // do not forget the last instance, just reset state
        draft.devices[index].state = undefined;
        draft.devices[index].walletNumber = undefined;
        draft.devices[index].useEmptyPassphrase = !device.features.passphrase_protection;
        draft.devices[index].passphraseOnDevice = false;
        // set remember to false to make it disappear after device is disconnected
        draft.devices[index].remember = false;
        draft.devices[index].metadata = {};
    } else {
        draft.devices.splice(index, 1);
    }
};

const forgetAndDisconnect = (draft: State, device: TrezorDevice) => {
    forget(draft, device);
    disconnectDevice(draft, device);
};

const addButtonRequest = (
    draft: State,
    device: TrezorDevice | undefined,
    buttonRequest?: ButtonRequest,
) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft.devices, device);
    if (!draft.devices[index]) return;
    // update state
    if (!buttonRequest) {
        draft.devices[index].buttonRequests = [];
        return;
    }
    draft.devices[index].buttonRequests.push(buttonRequest);
};

export const setDeviceAuthenticity = (
    draft: State,
    device: TrezorDevice,
    result?: StoredAuthenticateDeviceResult,
) => {
    if (!device.id) return;
    draft.deviceAuthenticity = {
        [device.id]: result,
    };
};

export const prepareDeviceReducer = createReducerWithExtraDeps(initialState, (builder, extra) => {
    builder
        .addCase(deviceActions.connectDevice, (state, { payload }) => {
            connectDevice(state, payload);
        })
        .addCase(deviceActions.connectUnacquiredDevice, (state, { payload }) => {
            connectDevice(state, payload);
        })
        .addCase(deviceActions.deviceChanged, (state, { payload }) => {
            changeDevice(state, payload, { connected: true, available: true });
        })
        .addCase(deviceActions.deviceDisconnect, (state, { payload }) => {
            disconnectDevice(state, payload);
        })
        .addCase(deviceActions.updatePassphraseMode, (state, { payload }) => {
            changePassphraseMode(state, payload.device, payload.hidden, payload.alwaysOnDevice);
        })
        .addCase(deviceActions.authFailed, (state, { payload }) => {
            authFailed(state, payload);
        })
        .addCase(deviceActions.receiveAuthConfirm, (state, { payload }) => {
            authConfirm(state, payload.device, payload.success);
        })
        .addCase(deviceActions.createDeviceInstance, (state, { payload }) => {
            createInstance(state, payload);
        })
        .addCase(deviceActions.rememberDevice, (state, { payload }) => {
            remember(state, payload.device, payload.remember, payload.forceRemember);
        })
        .addCase(deviceActions.forgetDevice, (state, { payload }) => {
            forget(state, payload);
        })
        .addCase(deviceActions.authDevice, (state, { payload }) => {
            authDevice(state, payload.device, payload.state);
        })
        .addCase(deviceActions.addButtonRequest, (state, { payload }) => {
            addButtonRequest(state, payload.device, payload.buttonRequest);
        })
        .addCase(deviceActions.requestDeviceReconnect, state => {
            if (state.selectedDevice) {
                state.selectedDevice.reconnectRequested = true;
            }
        })
        .addCase(deviceActions.selectDevice, (state, { payload }) => {
            updateTimestamp(state, payload);
            state.selectedDevice = payload;
        })
        .addCase(deviceActions.updateSelectedDevice, (state, { payload }) => {
            state.selectedDevice = payload;
        })
        .addCase(deviceAuthenticityActions.result, (state, { payload }) => {
            setDeviceAuthenticity(state, payload.device, payload.result);
        })
        .addCase(extra.actionTypes.setDeviceMetadata, extra.reducers.setDeviceMetadataReducer)
        .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadDevices)
        .addCase(deviceActions.forgetAndDisconnectDevice, (state, { payload }) => {
            forgetAndDisconnect(state, payload);
        });
});

export const selectDevices = (state: DeviceRootState) => state.device?.devices;
export const selectDevicesCount = (state: DeviceRootState) => state.device?.devices?.length;
export const selectIsPendingTransportEvent = (state: DeviceRootState) =>
    state.device.devices.length < 1;

export const selectDevice = (state: DeviceRootState) => state.device.selectedDevice;

export const selectIsDeviceUnlocked = (state: DeviceRootState) =>
    !!state.device.selectedDevice?.features?.unlocked;

export const selectDeviceType = (state: DeviceRootState) => state.device.selectedDevice?.type;

export const selectDeviceFeatures = (state: DeviceRootState) =>
    state.device.selectedDevice?.features;

export const selectIsDeviceProtectedByPin = (state: DeviceRootState) => {
    const features = selectDeviceFeatures(state);
    return !!features?.pin_protection;
};

export const selectDeviceButtonRequests = (state: DeviceRootState) =>
    state.device.selectedDevice?.buttonRequests ?? [];

export const selectDeviceButtonRequestsCodes = (state: DeviceRootState) => {
    const buttonRequests = selectDeviceButtonRequests(state);
    return buttonRequests.map(r => r.code);
};

export const selectDeviceMode = (state: DeviceRootState) => state.device.selectedDevice?.mode;

export const selectDeviceRequestedPin = (state: DeviceRootState) => {
    const buttonRequestsCodes = selectDeviceButtonRequestsCodes(state);
    const isDeviceProtectedByPin = selectIsDeviceProtectedByPin(state);

    if (!isDeviceProtectedByPin) return false;

    return buttonRequestsCodes?.some(code => code?.startsWith('PinMatrixRequestType')) ?? false;
};

export const selectIsUnacquiredDevice = (state: DeviceRootState) => {
    const deviceType = selectDeviceType(state);
    return deviceType === 'unacquired';
};

export const selectIsDeviceInBootloader = (state: DeviceRootState) => {
    const mode = selectDeviceMode(state);

    return mode === 'bootloader';
};

export const selectIsDeviceInitialized = (state: DeviceRootState) => {
    const features = selectDeviceFeatures(state);
    const mode = selectDeviceMode(state);

    if (mode === 'initialize' || mode === 'seedless') return false;

    return !!features?.initialized;
};

export const selectIsConnectedDeviceUninitialized = (state: DeviceRootState) => {
    const device = selectDevice(state);
    const isDeviceInitialized = selectIsDeviceInitialized(state);

    return device && !isDeviceInitialized;
};

export const selectIsSelectedDeviceAuthorized = (state: DeviceRootState) => {
    const device = selectDevice(state);
    return !!device?.state;
};

export const selectIsDeviceConnectedAndAuthorized = (state: DeviceRootState) => {
    const isDeviceAuthorized = selectIsSelectedDeviceAuthorized(state);
    const deviceFeatures = selectDeviceFeatures(state);

    return isDeviceAuthorized && !!deviceFeatures;
};
export const selectDeviceInternalModel = (state: DeviceRootState) =>
    state.device.selectedDevice?.features?.internal_model;

export const selectDeviceByState = (state: DeviceRootState, deviceState: string) =>
    selectDevices(state).find(d => d.state === deviceState);

export const selectDeviceUnavailableCapabilities = (state: DeviceRootState) =>
    state.device.selectedDevice?.unavailableCapabilities;

export const selectDeviceStatus = (state: DeviceRootState) => {
    const device = selectDevice(state);
    return device && getStatus(device);
};

export const selectSupportedNetworks = (state: DeviceRootState) => {
    const device = selectDevice(state);
    const deviceModelInternal = device?.features?.internal_model;
    const firmwareVersion = getFirmwareVersion(device);

    return Object.entries(networks)
        .map(([symbol, network]) => {
            const support =
                'support' in network ? (network.support as Network['support']) : undefined;

            const firmwareSupportRestriction =
                deviceModelInternal && support?.[deviceModelInternal];
            const isSupportedByApp =
                !firmwareVersion ||
                !firmwareSupportRestriction ||
                versionUtils.isNewerOrEqual(firmwareVersion, firmwareSupportRestriction);

            const unavailableReason = isSupportedByApp
                ? device?.unavailableCapabilities?.[symbol]
                : 'update-required';

            // if device does not have fw, do not show coins which are not supported by device in any case
            if (!firmwareVersion && unavailableReason === 'no-support') {
                return null;
            }
            // if device has fw, do not show coins which are not supported by current fw
            if (
                firmwareVersion &&
                ['no-support', 'no-capability'].includes(unavailableReason || '')
            ) {
                return null;
            }

            return symbol;
        })
        .filter(Boolean) as Network['symbol'][]; // Filter out null values
};

export const selectDeviceById = (state: DeviceRootState, deviceId: TrezorDevice['id']) =>
    state.device.devices.find(device => device.id === deviceId);

export const selectDeviceAuthenticity = (state: DeviceRootState) => {
    const device = selectDevice(state);
    return device?.id ? state.device.deviceAuthenticity?.[device.id] : undefined;
};

export const selectIsSelectedDeviceImported = (state: DeviceRootState) => {
    const device = selectDevice(state);
    return device?.id === PORTFOLIO_TRACKER_DEVICE_ID;
};

export const selectDeviceLabelById = (state: DeviceRootState, id: TrezorDevice['id']) => {
    const device = selectDeviceById(state, id);
    return device?.label ?? null;
};

export const selectDeviceNameById = (
    state: DeviceRootState,
    id: TrezorDevice['id'],
): string | null => {
    const device = selectDeviceById(state, id);
    return device?.name ?? null;
};

export const selectSelectedDeviceLabel = (state: DeviceRootState) => {
    const selectedDevice = selectDevice(state);
    return selectDeviceLabelById(state, selectedDevice?.id);
};

export const selectDeviceId = (state: DeviceRootState) => {
    const selectedDevice = selectDevice(state);
    return selectedDevice?.id ?? null;
};

export const selectDeviceModelById = (state: DeviceRootState, id: TrezorDevice['id']) => {
    const device = selectDeviceById(state, id);
    return device?.features?.internal_model ?? null;
};

export const selectDeviceModel = (state: DeviceRootState) => {
    const selectedDevice = selectDevice(state);
    return selectDeviceModelById(state, selectedDevice?.id);
};

export const selectDeviceReleaseInfo = (state: DeviceRootState) => {
    const device = selectDevice(state);
    return device?.firmwareRelease ?? null;
};

export const selectDeviceFirmwareVersion = memoize((state: DeviceRootState) => {
    const device = selectDevice(state);
    return getFirmwareVersionArray(device);
});

export const selectPersistedDevicesStates = (state: DeviceRootState) => {
    const devices = selectDevices(state);
    return [...devices.map(d => d.id), PORTFOLIO_TRACKER_DEVICE_STATE];
};

export const selectIsNoPhysicalDeviceConnected = (state: DeviceRootState) => {
    const devices = selectDevices(state);
    return devices.length === 1 && devices[0].id === PORTFOLIO_TRACKER_DEVICE_ID;
};

export const selectIsDeviceBitcoinOnly = (state: DeviceRootState) => {
    const features = selectDeviceFeatures(state);
    return features?.unit_btconly ?? false;
};

export const selectDeviceLanguage = (state: DeviceRootState) => {
    const features = selectDeviceFeatures(state);
    return features?.language ?? null;
};
