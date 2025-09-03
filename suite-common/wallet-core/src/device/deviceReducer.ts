import { isAnyOf } from '@reduxjs/toolkit';

import {
    StoredAuthenticateDeviceResult,
    deviceAuthenticityActions,
} from '@suite-common/device-authenticity';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { AcquiredDevice, ButtonRequest, TrezorDevice } from '@suite-common/suite-types';
import * as deviceUtils from '@suite-common/suite-utils';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { shouldDeviceBeRemembered } from '@suite-common/wallet-utils';
import {
    Device,
    DeviceState,
    Features,
    KnownDevice,
    StaticSessionId,
    VersionArray,
} from '@trezor/connect';
import { getFirmwareVersionArray } from '@trezor/device-utils';
import { UnionSubset } from '@trezor/type-utils';

import { deviceActions } from './deviceActions';
import { PORTFOLIO_TRACKER_DEVICE_ID } from './deviceConstants';

export type PersistedFeatureKey = UnionSubset<
    keyof Features,
    | 'device_id'
    | 'internal_model'
    | 'fw_vendor'
    | 'revision'
    | 'unit_color'
    | 'label'
    | 'initialized'
>;
export type PersistentDeviceData = Pick<Features, PersistedFeatureKey> & {
    firmwareVersion: VersionArray | null;
    lastConnectedBy: 'bluetooth' | 'usb' | null;
    // TODO move devicesWithFailedEntropyCheck to this object, including persistence & migration
    // TODO move deviceAuthenticity to this object and newly introduce persistence
};

export type DeviceReducerState = {
    devices: TrezorDevice[];
    persistentDeviceData: PersistentDeviceData[]; // is an array since there is not a single primary id, device can be matched by various criteria
    selectedDevice?: TrezorDevice;
    deviceAuthenticity?: Record<string, StoredAuthenticateDeviceResult>;
    devicesWithFailedEntropyCheck?: (string | null)[]; // protobuf allows null values and we want to store this even if a fake device has id set to null
    dismissedSecurityChecks?: {
        firmwareAuthenticity?: string[];
    };
    lastConnectedAuthenticityChecks?: KnownDevice['authenticityChecks'];
    isDeviceAutoEjectEnabled: boolean; // this is currently used only on mobile
};

export const deviceInitialState: DeviceReducerState = {
    devices: [],
    persistentDeviceData: [],
    selectedDevice: undefined,
    isDeviceAutoEjectEnabled: false,
};

export const deviceReducerInitialState = deviceInitialState;

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

/**
 * Action handler: DEVICE.CONNECT + DEVICE.CONNECT_UNACQUIRED
 * @param {DeviceReducerState} draft
 * @param {Device} device
 * @returns
 */
const connectDevice = (draft: DeviceReducerState, device: Device) => {
    const currentTime = new Date().getTime();

    const deviceCommonFields = {
        connected: true,

        buttonRequests: [],
        metadata: {},
        passwords: {},
        firstConnectedTimestamp:
            'firstConnectedTimestamp' in device
                ? Number(device.firstConnectedTimestamp ?? currentTime)
                : currentTime,
        ts: currentTime,
    };
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
            ...deviceCommonFields,
            available: false,
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

    const newDevice: TrezorDevice = {
        ...device,
        ...deviceCommonFields,
        state: device._state,
        useEmptyPassphrase: undefined,
        remember: shouldDeviceBeRemembered({
            isDeviceAutoEjectEnabled: draft.isDeviceAutoEjectEnabled,
            device,
        }),
        temporaryRemember: false,
        available: true,
        instance: deviceInstance,
        localFirstStorageSecret: undefined,
    };

    // update affected devices
    if (affectedDevices.length > 0) {
        const changedDevices = affectedDevices.map(d => {
            // change availability according to "passphrase_protection" field
            if (
                d.useEmptyPassphrase === true &&
                isUnlocked(device.features) &&
                !features.passphrase_protection
            ) {
                return merge(d, { ...device, connected: true, available: false });
            }

            return merge(d, { ...device, connected: true, available: true });
        });

        // fill draft with affectedDevices values
        changedDevices.forEach(d => draft.devices.push(d));
    } else {
        // add new device
        draft.devices.push(newDevice);
    }
};

const addAuthorizedDevice = (draft: DeviceReducerState, device: TrezorDevice) => {
    device.walletNumber = deviceUtils.getNewWalletNumber(draft.devices, device);
    delete device.discovered;
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
    extended: Partial<AcquiredDevice>,
) => {
    // change only acquired and THP devices
    if (!device.features) {
        if (device.thp) {
            const affectedDevice = draft.devices.find(d => !d.features && d.path === device.path);
            if (affectedDevice) {
                affectedDevice.status = device.status;
                affectedDevice.thp = device.thp;
            }
        }

        return;
    }

    // this is not nice - during passphrase/discovery refactor, I made a decision that we are not going to update device.state in reducer
    // in any other case than as a result of device authorization (passphrase+discovery). But later we realized that we need to update device.state.sessionId
    // for saved devices too https://github.com/trezor/trezor-suite/issues/19411 so I am adding this as a quick fix that should work until we come up with a better solution.
    const staticSessionId = device?.state;
    const deviceBeforeUpdate = staticSessionId
        ? draft.devices.find(d => d.state?.staticSessionId === staticSessionId)
        : undefined;
    const shouldUpdateState =
        !!deviceBeforeUpdate &&
        deviceBeforeUpdate.remember &&
        !deviceBeforeUpdate.useEmptyPassphrase;

    if (!shouldUpdateState) {
        // ignore device state updates. we set device state explicitly using addAuthorizedDevice or setDeviceState
        delete device.state;
        // @ts-expect-error - connect feeds this but we don't work with it
        delete device._state;
    }

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
    const affectedDevice = draft.devices.filter(d => {
        if (!d.features) return false;

        const isConnectedDeviceMatch =
            d.connected &&
            d.instance === device.instance &&
            (d.id === device.id || (d.path.length > 0 && d.path === device.path));

        // update "disconnected" remembered devices if in bootloader mode
        const isRememberedDeviceMatch = d.mode === 'bootloader' && d.remember && d.id === device.id;

        return isConnectedDeviceMatch || isRememberedDeviceMatch;
    });

    if (affectedDevice.length > 1) {
        console.error('there must be only one device with the same id and without state');

        return;
    }

    affectedDevice[0].state = state;
    affectedDevice[0].useEmptyPassphrase = useEmptyPassphrase;
    affectedDevice[0].walletNumber = deviceUtils.getNewWalletNumber(draft.devices, device);
    delete affectedDevice[0].discovered;

    affectedDevice[0].remember = shouldDeviceBeRemembered({
        isDeviceAutoEjectEnabled: draft.isDeviceAutoEjectEnabled,
        device,
    });
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
        remember: true,
        // In mobile app, we need to keep device state defined by the constant
        // to be able to filter device accounts for portfolio tracker
        state: isPortfolioTrackerDevice ? device.state : undefined,
        walletNumber: undefined,
        ts: currentTime,
        firstConnectedTimestamp: device.firstConnectedTimestamp ?? currentTime,
        buttonRequests: [],
        metadata: {},
        passwords: {},
        localFirstStorageSecret: undefined,
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
const forget = (draft: DeviceReducerState, device: TrezorDevice) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft.devices, device);
    if (!draft.devices[index]) return;
    const others = deviceUtils.getDeviceInstances(device, draft.devices, true);
    if (device.connected && others.length < 1) {
        // do not forget the last instance, just reset state
        draft.devices[index].state = undefined;
        draft.devices[index].walletNumber = undefined;

        draft.devices[index].useEmptyPassphrase = undefined;

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

// called after successful wipeDevice
const requestDeviceReconnect = (draft: DeviceReducerState) => {
    // only acquired devices
    if (!draft.selectedDevice?.features) return;
    const index = deviceUtils.findInstanceIndex(draft.devices, draft.selectedDevice);
    if (!draft.devices[index]) return;
    draft.selectedDevice.reconnectRequested = true;
    draft.devices[index].reconnectRequested = true;
};

const updatePersistentDeviceData = (draft: DeviceReducerState, device: Device | TrezorDevice) => {
    if (!device.features) return; // do not persist data for unacquired/unreadable devices

    const newPersistentData: PersistentDeviceData = {
        device_id: device.features.device_id,
        internal_model: device.features.internal_model,
        fw_vendor: device.features.fw_vendor,
        revision: device.features.revision,
        unit_color: device.features.unit_color,
        label: device.features.label,
        initialized: device.features.initialized,
        lastConnectedBy: device.bluetoothProps ? 'bluetooth' : 'usb',
        firmwareVersion: getFirmwareVersionArray(device),
    };

    const index = draft.persistentDeviceData.findIndex(d => d.device_id === device.id);
    if (index >= 0) {
        draft.persistentDeviceData[index] = {
            ...draft.persistentDeviceData[index],
            ...newPersistentData,
        };
    } else {
        draft.persistentDeviceData.push(newPersistentData);
    }
};

export const prepareDeviceReducer = createReducerWithExtraDeps(
    deviceInitialState,
    (builder, extra) => {
        builder
            .addCase(deviceActions.deviceChanged, (state, { payload }) => {
                changeDevice(state, payload, { connected: true, available: true });
                updatePersistentDeviceData(state, payload);
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
            .addCase(deviceActions.rememberDevice, (state, { payload }) => {
                remember(state, payload.device, payload.remember, payload.forceRemember);
            })
            .addCase(deviceActions.setTemporaryRememberedDevice, (state, { payload }) => {
                setTemporaryRememberedDevice(state, payload.device, payload.temporaryRemember);
            })
            .addCase(deviceActions.forgetDevice, (state, { payload }) => {
                forget(state, payload.device);
            })
            .addCase(deviceActions.forgetDevicePersistentData, (state, { payload }) => {
                state.persistentDeviceData = state.persistentDeviceData.filter(
                    d => d.device_id !== payload.deviceId,
                );
            })
            .addCase(deviceActions.forgetAllDevicesPersistentData, state => {
                state.persistentDeviceData = [];
            })
            .addCase(deviceActions.addButtonRequest, (state, { payload }) => {
                addButtonRequest(state, payload.device, payload.buttonRequest);
            })
            .addCase(deviceActions.removeButtonRequests, (state, { payload }) => {
                removeButtonRequests(state, payload.device, payload.buttonRequestCode);
            })
            .addCase(deviceActions.requestDeviceReconnect, state => {
                requestDeviceReconnect(state);
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
            .addCase(
                deviceActions.setLocalFirstStorageSecret,
                (state, { payload: { device, evoluKeys } }) => {
                    if (!device.features) return;
                    const index = deviceUtils.findInstanceIndex(state.devices, device);
                    if (!state.devices[index]) return;
                    state.devices[index].localFirstStorageSecret = { evoluKeys };
                },
            )
            .addCase(deviceActions.toggleIsDeviceAutoEjectEnabled, state => {
                state.isDeviceAutoEjectEnabled = !state.isDeviceAutoEjectEnabled;
            })
            .addCase(deviceActions.setDiscovered, (state, { payload }) => {
                const device = state.devices.find(
                    d => d.state?.staticSessionId === payload.staticSessionId,
                );
                if (device) device.discovered = payload.success;
            })
            .addMatcher(
                isAnyOf(deviceActions.connectDevice, deviceActions.connectUnacquiredDevice),
                (state, { payload: { device } }) => {
                    connectDevice(state, device);
                    updatePersistentDeviceData(state, device);
                },
            );
    },
);
