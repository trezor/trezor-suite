import { PayloadAction, AnyAction } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { Device, DEVICE, Features } from '@trezor/connect';

import { SUITE } from 'src/actions/suite/constants';
import * as deviceUtils from 'src/utils/suite/device';
import type { TrezorDevice, AcquiredDevice, ButtonRequest } from 'src/types/suite';

type DeviceState = {
    devices: TrezorDevice[];
    // TODO add device
};

const initialState: DeviceState = {
    devices: [],
};

export type DeviceRootState = {
    device: {
        devices: TrezorDevice[];
        // TODO add device
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
 * @param {DeviceState} draft
 * @param {Device} device
 * @returns
 */
const connectDevice = (draft: DeviceState, device: Device) => {
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
            metadata: { status: 'disabled' },
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
        metadata: { status: 'disabled' },
        ts: new Date().getTime(),
    };

    // update affected devices
    if (affectedDevices.length > 0) {
        const changedDevices = affectedDevices.map(d => {
            // change availability according to "passphrase_protection" field
            if (d.instance && isUnlocked(device.features) && !features.passphrase_protection) {
                return merge(d, { ...device, connected: true, available: false });
            }
            return merge(d, { ...device, connected: true, available: true });
        });

        // affected device with current "passphrase_protection" does not exists
        // basically it means that the "base" device without "instance" was forgotten (removed from reducer)
        // automatically create new instance
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
 * @param {DeviceState} draft
 * @param {(Device | TrezorDevice)} device
 * @param {Partial<AcquiredDevice>} [extended]
 * @returns
 */
const changeDevice = (
    draft: DeviceState,
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
        // merge incoming device with DeviceState
        const changedDevices = affectedDevices.map(d => {
            // change availability according to "passphrase_protection" field
            if (
                d.instance &&
                isUnlocked(device.features) &&
                !device.features.passphrase_protection
            ) {
                return merge(d, { ...device, ...extended, available: !d.state });
            }
            return merge(d, { ...device, ...extended, available: true });
        });
        // fill draft with affectedDevices values
        changedDevices.forEach(d => draft.devices.push(d));
    }
};

/**
 * Action handler: DEVICE.DISCONNECT
 * @param {DeviceState} draft
 * @param {Device} device
 */
const disconnectDevice = (draft: DeviceState, device: Device) => {
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
 * Action handler: SUITE.CREATE_DEVICE_INSTANCE
 * @param {DeviceState} draft
 * @param {TrezorDevice} device
 * @returns
 */
const createInstance = (draft: DeviceState, device: TrezorDevice) => {
    // only acquired devices
    if (!device || !device.features) return;
    const newDevice: TrezorDevice = {
        ...device,
        passphraseOnDevice: false,
        remember: false,
        state: undefined,
        walletNumber: undefined,
        authConfirm: false,
        ts: new Date().getTime(),
        buttonRequests: [],
        metadata: { status: 'disabled' },
    };
    draft.devices.push(newDevice);
};

/**
 * Action handler: SUITE.REMEMBER_DEVICE
 * Set `remember` field for a single device instance
 * @param {DeviceState} draft
 * @param {TrezorDevice} device
 * @param {boolean} remember
 * @param {boolean} forceRemember
 */
const rememberDevice = (
    draft: DeviceState,
    device: TrezorDevice,
    remember: boolean,
    forceRemember = true,
) => {
    // only acquired devices
    if (!device || !device.features) return;
    draft.devices.forEach(d => {
        if (deviceUtils.isSelectedInstance(device, d)) {
            d.remember = remember;
            if (forceRemember) d.forceRemember = true;
            else delete d.forceRemember;
        }
    });
};

/**
 * Action handler: SUITE.FORGET_DEVICE
 * Remove all device instances
 * @param {DeviceState} draft
 * @param {TrezorDevice} device
 * @returns
 */
const forget = (draft: DeviceState, device: TrezorDevice) => {
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
        draft.devices[index].metadata = { status: 'disabled' };
    } else {
        draft.devices.splice(index, 1);
    }
};

const addButtonRequest = (
    draft: DeviceState,
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

export const prepareDeviceReducer = createReducerWithExtraDeps(initialState, (builder, extra) => {
    builder
        .addCase(extra.actionTypes.setDeviceMetadata, extra.reducers.setDeviceMetadataReducer)
        .addCase(extra.actionTypes.storageLoad, (_, action: AnyAction) => action.payload.devices)
        .addCase(extra.actionTypes.suiteSelectDevice, extra.reducers.suiteSelectDeviceReducer)
        .addCase(
            extra.actionTypes.suiteUpdatePassphraseMode,
            extra.reducers.updatePassphraseModeReducer,
        )
        .addCase(extra.actionTypes.suiteAuthFailed, extra.reducers.suiteAuthFailedReducer)
        .addCase(extra.actionTypes.suiteAuthDevice, extra.reducers.suiteAuthDeviceReducer)
        .addCase(
            extra.actionTypes.suiteReceiveAuthConfirm,
            extra.reducers.suiteReceiveAuthConfirmReducer,
        )
        .addMatcher(
            action => action.type === SUITE.CREATE_DEVICE_INSTANCE,
            (state, { payload }: PayloadAction<TrezorDevice>) => {
                createInstance(state, payload);
            },
        )
        .addMatcher(
            action => action.type === SUITE.REMEMBER_DEVICE,
            (
                state,
                {
                    payload,
                    remember,
                    forceRemember,
                }: PayloadAction<TrezorDevice> & { remember: boolean; forceRemember: boolean },
            ) => {
                rememberDevice(state, payload, remember, forceRemember);
            },
        )
        .addMatcher(
            action => action.type === SUITE.FORGET_DEVICE,
            (state, { payload }: PayloadAction<TrezorDevice>) => {
                forget(state, payload);
            },
        )
        .addMatcher(
            action => action.type === SUITE.ADD_BUTTON_REQUEST,
            (
                state,
                {
                    payload,
                    buttonRequest,
                }: PayloadAction<TrezorDevice | undefined> & { buttonRequest?: ButtonRequest },
            ) => {
                addButtonRequest(state, payload, buttonRequest);
            },
        )
        .addMatcher(
            action => action.type === DEVICE.CONNECT || action.type === DEVICE.CONNECT_UNACQUIRED,
            (state, { payload }: PayloadAction<Device>) => {
                connectDevice(state, payload);
            },
        )
        .addMatcher(
            action => action.type === DEVICE.CHANGED,
            (state, { payload }: PayloadAction<Device | TrezorDevice>) => {
                changeDevice(state, payload, { connected: true, available: true });
            },
        )
        .addMatcher(
            action => action.type === DEVICE.DISCONNECT,
            (state, { payload }: PayloadAction<Device>) => {
                disconnectDevice(state, payload);
            },
        );
});

export const selectDevices = (state: DeviceRootState) => state.device.devices;
export const selectDeviceCount = (state: DeviceRootState) => state.device.devices.length;
export const selectIsPendingTransportEvent = (state: DeviceRootState) =>
    state.device.devices.length < 1;
