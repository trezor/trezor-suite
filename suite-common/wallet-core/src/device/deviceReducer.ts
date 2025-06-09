import { isAnyOf } from '@reduxjs/toolkit';

import {
    StoredAuthenticateDeviceResult,
    deviceAuthenticityActions,
} from '@suite-common/device-authenticity';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { AcquiredDevice, ButtonRequest, TrezorDevice } from '@suite-common/suite-types';
import * as deviceUtils from '@suite-common/suite-utils';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { Device, DeviceState, Features, KnownDevice, StaticSessionId, UI } from '@trezor/connect';
import { isNative } from '@trezor/env-utils';

import { ConnectDeviceSettings, deviceActions } from './deviceActions';
import { PORTFOLIO_TRACKER_DEVICE_ID } from './deviceConstants';

export type DeviceReducerState = {
    devices: TrezorDevice[];
    selectedDevice?: TrezorDevice;
    deviceAuthenticity?: Record<string, StoredAuthenticateDeviceResult>;
    devicesWithFailedEntropyCheck?: (string | null)[]; // protobuf allows null values and we want to store this even if a fake device has id set to null
    dismissedSecurityChecks?: {
        firmwareAuthenticity?: string[];
    };
    lastConnectedAuthenticityChecks?: KnownDevice['authenticityChecks'];
};

const initialState: DeviceReducerState = { devices: [], selectedDevice: undefined };

export type DeviceRootState = {
    device: DeviceReducerState;
};

// Use the negated form as it better fits the call sites.
/** Returns true if device with given Features is not locked. */
const isUnlocked = (features: Features): boolean =>
    typeof features.unlocked === 'boolean'
        ? features.unlocked
        : // Older FW (<2.3.2) which doesn't have `unlocked` feature also doesn't have auto-lock and is always unlocked.
          true;

/**
 * Local utility: get state in DeviceState format from AcquiredDevice in backwards compatible way
 * @param upcoming
 * @returns
 */
const mergeDeviceState = (
    device: AcquiredDevice,
    upcoming: Partial<
        AcquiredDevice & { state?: DeviceState | StaticSessionId; _state?: DeviceState }
    >,
): DeviceState | undefined => {
    const upcomingState = typeof upcoming.state === 'string' ? upcoming._state : upcoming.state;
    if (
        // state was previously not defined, we can set it
        device.state === undefined ||
        // update sessionId for the same staticSessionId
        (upcomingState &&
            device.state?.staticSessionId === upcomingState.staticSessionId &&
            device.state?.sessionId !== upcomingState.sessionId)
    ) {
        return upcomingState;
    }
};

/**
 * Local utility: set updated fields for device
 * @param {AcquiredDevice} device
 * @param {Partial<AcquiredDevice>} upcoming
 * @returns {TrezorDevice}
 */
const merge = (
    device: AcquiredDevice,
    // this method can take the old string state type, since it's not used here
    upcoming: Partial<
        AcquiredDevice & { state?: DeviceState | StaticSessionId; _state: DeviceState }
    >,
): TrezorDevice => ({
    ...device,
    ...upcoming,
    id: upcoming.id ?? device.id,
    state: mergeDeviceState(device, upcoming) ?? device.state,
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

const getShouldUseEmptyPassphrase = (
    device: Device | TrezorDevice,
    deviceInstance: number | undefined,
    settings: ConnectDeviceSettings,
): boolean => {
    if (!device.features) return false;

    if (isNative() && (!deviceInstance || deviceInstance === 1)) {
        // On mobile, if device has instance === 1, we always want to use empty passphrase since we
        // connect & authorize standard wallet by default. Other instances will have `usePassphraseProtection` set same way as web/desktop app.
        return true;
    }

    return !device.features.passphrase_protection || settings.defaultWalletLoading === 'standard';
};
/**
 * Action handler: DEVICE.CONNECT + DEVICE.CONNECT_UNACQUIRED
 * @param {DeviceReducerState} draft
 * @param {Device} device
 * @returns
 */
const connectDevice = (
    draft: DeviceReducerState,
    device: Device,
    settings: ConnectDeviceSettings,
) => {
    // connected device is unacquired/unreadable
    if (!device.features) {
        // check if device already exists in reducer
        const unacquiredDevices = draft.devices.filter(d => d.path === device.path);
        if (unacquiredDevices.length > 0) {
            // and ignore this action if so
            return;
        }
        const currentTime = new Date().getTime();
        draft.devices.push({
            ...device,
            connected: true,
            available: false,
            useEmptyPassphrase: true,
            buttonRequests: [],
            metadata: {},
            passwords: {},
            firstConnectedTimestamp:
                'firstConnectedTimestamp' in device
                    ? Number(device.firstConnectedTimestamp ?? currentTime)
                    : currentTime,
            ts: currentTime,
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

    const deviceInstance = features.passphrase_protection
        ? deviceUtils.getNewInstanceNumber(draft.devices, device) || 1
        : undefined;

    const useEmptyPassphrase = getShouldUseEmptyPassphrase(device, deviceInstance, settings);

    const currentTime = new Date().getTime();
    const newDevice: TrezorDevice = {
        ...device,
        state: device._state,
        useEmptyPassphrase,
        remember: false,
        temporaryRemember: false,
        connected: true,
        available: true,
        authConfirm: false,
        instance: deviceInstance,
        buttonRequests: [],
        metadata: {},
        passwords: {},
        firstConnectedTimestamp:
            'firstConnectedTimestamp' in device
                ? Number(device.firstConnectedTimestamp ?? currentTime)
                : currentTime,
        ts: currentTime,
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

const addAuthorizedDevice = (draft: DeviceReducerState, device: TrezorDevice) => {
    device.walletNumber = deviceUtils.getNewWalletNumber(draft.devices, device);
    draft.devices.push(device);
};

/**
 * Action handler: DEVICE.CHANGED
 * @param {DeviceReducerState} draft
 * @param {(Device | TrezorDevice)} device
 * @param {Partial<AcquiredDevice>} [extended]
 * @returns
 */
const changeDevice = (
    draft: DeviceReducerState,
    device: Device | TrezorDevice,
    extended?: Partial<AcquiredDevice>,
) => {
    // change only acquired devices
    if (!device.features) return;

    // ignore device state updates. we set device state explicitly using addAuthorizedDevice or setDeviceState
    delete device.state;
    // @ts-expect-error - connect feeds this but we don't work with it
    delete device._state;

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
                // if device with passphrase disabled is not authorized (no state) and becomes unlocked update useEmptyPassphrase field (hidden/standard wallet)
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

const setDeviceState = (
    draft: DeviceReducerState,
    device: TrezorDevice,
    state: DeviceState,
    useEmptyPassphrase: boolean,
) => {
    // change only acquired devices
    if (!device.features) return;

    // find devices with the same "device_id"
    const affectedDevice = draft.devices.filter(
        d =>
            d.features &&
            ((d.connected &&
                (d.id === device.id || (d.path.length > 0 && d.path === device.path))) ||
                // update "disconnected" remembered devices if in bootloader mode
                (d.mode === 'bootloader' && d.remember && d.id === device.id)),
    ) as AcquiredDevice[];

    if (affectedDevice.length > 1) {
        console.error('there must be only one device with the same id and without state');

        return;
    }

    affectedDevice[0].state = state;
    affectedDevice[0].useEmptyPassphrase = useEmptyPassphrase;
    // affectedDevice[0].instance = Number.parseInt(state.staticSessionId?.split(':')[1]!);
    affectedDevice[0].walletNumber = deviceUtils.getNewWalletNumber(draft.devices, device);
};

/**
 * Action handler: DEVICE.DISCONNECT
 * @param {DeviceReducerState} draft
 * @param {Device} device
 */
const disconnectDevice = (draft: DeviceReducerState, device: TrezorDevice) => {
    // find all devices with "path"
    const affectedDevices = draft.devices.filter(d => d.path === device.path);
    affectedDevices.forEach(d => {
        // do not remove devices with state, they are potential candidates to remember if not remembered already
        const skip = d.features && d.remember;
        if (skip) {
            d.connected = false;
            d.available = false;
            // @ts-expect-error
            d.path = '';
        } else {
            draft.devices.splice(draft.devices.indexOf(d), 1);
        }
    });

    if (isDeviceAcquired(device)) {
        draft.lastConnectedAuthenticityChecks = device.authenticityChecks;
    }
};

/**
 * Action handler: SUITE.SELECT_DEVICE
 * @param {DeviceReducerState} draft
 * @param {TrezorDevice} [device]
 * @returns
 */
const updateTimestamp = (draft: DeviceReducerState, device?: TrezorDevice) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft.devices, device);
    if (!draft.devices[index]) return;
    // update timestamp
    const currentTime = new Date().getTime();
    draft.devices[index].ts = currentTime;
    draft.devices[index].firstConnectedTimestamp =
        draft.devices[index].firstConnectedTimestamp ?? currentTime;
};

/**
 * Action handler: SUITE.RECEIVE_PASSPHRASE_MODE + SUITE.UPDATE_PASSPHRASE_MODE
 * @param {DeviceReducerState} draft
 * @param {TrezorDevice} device
 * @param {boolean} hidden
 * @param {boolean} [alwaysOnDevice=false]
 * @returns
 */
const updatePassphraseMode = (
    draft: DeviceReducerState,
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
 * Action handler: UI.REQUEST_PIN
 * Reset authFailed flag
 * @param {DeviceReducerState} draft
 * @returns
 */
const resetAuthFailed = (draft: DeviceReducerState) => {
    const device = draft.selectedDevice;
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft.devices, device);
    if (!draft.devices[index]) return;
    draft.devices[index].authFailed = false;
};

/**
 * Action handler: SUITE.CREATE_DEVICE_INSTANCE
 * @param {DeviceReducerState} draft
 * @param {TrezorDevice} device
 * @returns
 */
// TODO: this now can only be used for imported device!
const createInstance = (draft: DeviceReducerState, device: TrezorDevice) => {
    // only acquired devices
    if (!device || !device.features) return;

    const isPortfolioTrackerDevice = device.id === PORTFOLIO_TRACKER_DEVICE_ID;

    const currentTime = new Date().getTime();
    const newDevice: TrezorDevice = {
        ...device,
        passphraseOnDevice: false,
        remember: isPortfolioTrackerDevice,
        // In mobile app, we need to keep device state defined by the constant
        // to be able to filter device accounts for portfolio tracker
        state: isPortfolioTrackerDevice ? device.state : undefined,
        walletNumber: undefined,
        authConfirm: false,
        ts: currentTime,
        firstConnectedTimestamp: device.firstConnectedTimestamp ?? currentTime,
        buttonRequests: [],
        metadata: {},
        passwords: {},
    };
    draft.devices.push(newDevice);
};

/**
 * Action handler: SUITE.REMEMBER_DEVICE
 * Set `remember` field for a single device instance
 * @param {DeviceReducerState} draft
 * @param {TrezorDevice} device
 * @param {boolean} remember
 */
const remember = (
    draft: DeviceReducerState,
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
 * This actions is used to temporary remember device for fw update
 * @param {DeviceReducerState} draft
 * @param {TrezorDevice} device
 * @param {boolean} temporaryRemember
 */
const setTemporaryRememberedDevice = (
    draft: DeviceReducerState,
    device: TrezorDevice,
    temporaryRemember: boolean,
) => {
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft.devices, device);
    const selectedInstance = draft.devices[index];
    if (!selectedInstance) return;

    if (temporaryRemember && !selectedInstance.remember) {
        selectedInstance.temporaryRemember = true;
        selectedInstance.remember = true;
    } else if (!temporaryRemember && selectedInstance.temporaryRemember) {
        selectedInstance.temporaryRemember = false;
        selectedInstance.remember = false;
    }
};

/**
 * Action handler: SUITE.FORGET_DEVICE
 * Remove all device instances
 * @param {DeviceReducerState} draft
 * @param {TrezorDevice} device
 * @returns
 */
const forget = (
    draft: DeviceReducerState,
    device: TrezorDevice,
    settings: ConnectDeviceSettings,
) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft.devices, device);
    if (!draft.devices[index]) return;
    const others = deviceUtils.getDeviceInstances(device, draft.devices, true);
    if (device.connected && others.length < 1) {
        // do not forget the last instance, just reset state
        draft.devices[index].authConfirm = false;
        delete draft.devices[index].authFailed;
        draft.devices[index].state = undefined;
        draft.devices[index].walletNumber = undefined;

        draft.devices[index].useEmptyPassphrase = getShouldUseEmptyPassphrase(
            device,
            undefined,
            settings,
        );

        draft.devices[index].passphraseOnDevice = false;
        // set remember to false to make it disappear after device is disconnected
        draft.devices[index].remember = false;
        draft.devices[index].metadata = {};
        draft.devices[index].passwords = {};
    } else {
        draft.devices.splice(index, 1);
    }
};

const addButtonRequest = (
    draft: DeviceReducerState,
    device: TrezorDevice | undefined,
    buttonRequest: ButtonRequest,
) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft.devices, device);
    if (!draft.devices[index]) return;
    // update state

    draft.devices[index].buttonRequests.push(buttonRequest);
};

const removeButtonRequests = (
    draft: DeviceReducerState,
    device?: TrezorDevice,
    buttonRequestCode?: ButtonRequest['code'],
) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft.devices, device);
    if (!draft.devices[index]) return;
    // update state
    if (!buttonRequestCode) {
        draft.devices[index].buttonRequests = [];

        return;
    }

    draft.devices[index].buttonRequests = draft.devices[index].buttonRequests.filter(
        ({ code }) => code !== buttonRequestCode,
    );
};

export const setDeviceAuthenticity = (
    draft: DeviceReducerState,
    device: TrezorDevice,
    result?: StoredAuthenticateDeviceResult,
) => {
    if (!device.id) return;
    draft.deviceAuthenticity = {
        ...draft.deviceAuthenticity,
        [device.id]: result,
    };
};

export const prepareDeviceReducer = createReducerWithExtraDeps(initialState, (builder, extra) => {
    builder
        .addCase(deviceActions.deviceChanged, (state, { payload }) => {
            changeDevice(state, payload, { connected: true, available: true });
        })
        .addCase(deviceActions.setDeviceState, (state, { payload }) => {
            setDeviceState(state, payload.device, payload.state, payload.useEmptyPassphrase);
        })
        .addCase(deviceActions.addAuthorizedDevice, (state, { payload }) => {
            addAuthorizedDevice(state, payload.device);
        })

        .addCase(deviceActions.deviceDisconnect, (state, { payload }) => {
            disconnectDevice(state, payload);
        })
        .addCase(deviceActions.updatePassphraseMode, (state, { payload }) => {
            updatePassphraseMode(state, payload.device, payload.hidden, payload.alwaysOnDevice);
        })
        .addCase(UI.REQUEST_PIN, state => {
            resetAuthFailed(state);
        })
        .addCase(deviceActions.rememberDevice, (state, { payload }) => {
            remember(state, payload.device, payload.remember, payload.forceRemember);
        })
        .addCase(deviceActions.setTemporaryRememberedDevice, (state, { payload }) => {
            setTemporaryRememberedDevice(state, payload.device, payload.temporaryRemember);
        })
        .addCase(deviceActions.forgetDevice, (state, { payload }) => {
            forget(state, payload.device, payload.settings);
        })
        .addCase(deviceActions.addButtonRequest, (state, { payload }) => {
            addButtonRequest(state, payload.device, payload.buttonRequest);
        })
        .addCase(deviceActions.removeButtonRequests, (state, { payload }) => {
            removeButtonRequests(state, payload.device, payload.buttonRequestCode);
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
        .addCase(deviceActions.dismissFirmwareAuthenticityCheck, (state, { payload }) => {
            if (!state.dismissedSecurityChecks) {
                state.dismissedSecurityChecks = {};
            }
            if (!state.dismissedSecurityChecks.firmwareAuthenticity) {
                state.dismissedSecurityChecks.firmwareAuthenticity = [];
            }
            state.dismissedSecurityChecks.firmwareAuthenticity.unshift(payload);
        })
        .addCase(extra.actionTypes.setDeviceMetadata, extra.reducers.setDeviceMetadataReducer)
        .addCase(
            extra.actionTypes.setDeviceMetadataPasswords,
            extra.reducers.setDeviceMetadataPasswordsReducer,
        )
        .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadDevices)
        .addCase(deviceActions.setEntropyCheckFail, (state, { payload }) => {
            if (!state.devicesWithFailedEntropyCheck) {
                state.devicesWithFailedEntropyCheck = [];
            }
            state.devicesWithFailedEntropyCheck.push(payload);
        })
        .addCase(deviceActions.createDeviceInstance, (state, { payload }) => {
            createInstance(state, payload.device);
        })
        .addMatcher(
            isAnyOf(deviceActions.connectDevice, deviceActions.connectUnacquiredDevice),
            (state, { payload: { device, settings } }) => {
                connectDevice(state, device, settings);
            },
        );
});
