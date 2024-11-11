import { isAnyOf } from '@reduxjs/toolkit';
import { A, pipe } from '@mobily/ts-belt';

import * as deviceUtils from '@suite-common/suite-utils';
import { getDeviceInstances, getStatus } from '@suite-common/suite-utils';
import { Device, DeviceState, Features, StaticSessionId, UI } from '@trezor/connect';
import {
    getFirmwareVersion,
    getFirmwareVersionArray,
    hasBitcoinOnlyFirmware,
    isBitcoinOnlyDevice,
} from '@trezor/device-utils';
import { NetworkSymbol, networks } from '@suite-common/wallet-config';
import {
    createReducerWithExtraDeps,
    createWeakMapSelector,
    returnStableArrayIfEmpty,
} from '@suite-common/redux-utils';
import { TrezorDevice, AcquiredDevice, ButtonRequest } from '@suite-common/suite-types';
import {
    deviceAuthenticityActions,
    StoredAuthenticateDeviceResult,
} from '@suite-common/device-authenticity';
import { isNative } from '@trezor/env-utils';

import {
    authorizeDeviceThunk,
    createDeviceInstanceThunk,
    createImportedDeviceThunk,
} from './deviceThunks';
import { ConnectDeviceSettings, deviceActions } from './deviceActions';
import { PORTFOLIO_TRACKER_DEVICE_ID } from './deviceConstants';

const createMemoizedSelector = createWeakMapSelector.withTypes<DeviceRootState>();

export type State = {
    devices: TrezorDevice[];
    selectedDevice?: TrezorDevice;
    deviceAuthenticity?: Record<string, StoredAuthenticateDeviceResult>;
    dismissedSecurityChecks?: {
        firmwareAuthenticity?: string[];
    };
};

const initialState: State = { devices: [], selectedDevice: undefined };

export type DeviceRootState = {
    device: State;
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

    const isPassphraseDisabledInSettings = !device.features.passphrase_protection;

    return isPassphraseDisabledInSettings || settings.defaultWalletLoading === 'standard';
};
/**
 * Action handler: DEVICE.CONNECT + DEVICE.CONNECT_UNACQUIRED
 * @param {State} draft
 * @param {Device} device
 * @returns
 */
const connectDevice = (draft: State, device: Device, settings: ConnectDeviceSettings) => {
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
            passwords: {},
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

    const deviceInstance = features.passphrase_protection
        ? deviceUtils.getNewInstanceNumber(draft.devices, device) || 1
        : undefined;

    const useEmptyPassphrase = getShouldUseEmptyPassphrase(device, deviceInstance, settings);

    const newDevice: TrezorDevice = {
        ...device,
        state: device._state,
        useEmptyPassphrase,
        remember: false,
        connected: true,
        available: true,
        authConfirm: false,
        instance: deviceInstance,
        buttonRequests: [],
        metadata: {},
        passwords: {},
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

/**
 * Action handler: DEVICE.DISCONNECT
 * @param {State} draft
 * @param {Device} device
 */
const disconnectDevice = (draft: State, device: TrezorDevice) => {
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
 * @param {DeviceState} state
 * @returns
 */
const authDevice = (draft: State, device: TrezorDevice, state: DeviceState) => {
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
 * Action handler: authorizeDeviceThunk.pending
 * Reset authFailed flag
 * @param {State} draft
 * @returns
 */
const resetAuthFailed = (draft: State) => {
    const device = draft.selectedDevice;
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft.devices, device);
    if (!draft.devices[index]) return;
    draft.devices[index].authFailed = false;
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
        remember: isPortfolioTrackerDevice,
        // In mobile app, we need to keep device state defined by the constant
        // to be able to filter device accounts for portfolio tracker
        state: isPortfolioTrackerDevice ? device.state : undefined,
        walletNumber: undefined,
        authConfirm: false,
        ts: new Date().getTime(),
        buttonRequests: [],
        metadata: {},
        passwords: {},
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
const forget = (draft: State, device: TrezorDevice, settings: ConnectDeviceSettings) => {
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
    draft: State,
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
    draft: State,
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
    draft: State,
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
        .addCase(deviceActions.deviceDisconnect, (state, { payload }) => {
            disconnectDevice(state, payload);
        })
        .addCase(deviceActions.updatePassphraseMode, (state, { payload }) => {
            changePassphraseMode(state, payload.device, payload.hidden, payload.alwaysOnDevice);
        })
        .addCase(authorizeDeviceThunk.pending, state => {
            resetAuthFailed(state);
        })
        .addCase(authorizeDeviceThunk.fulfilled, (state, { payload }) => {
            authDevice(state, payload.device, payload.state);
        })
        .addCase(authorizeDeviceThunk.rejected, (state, action) => {
            if (action.payload && action.payload.error) {
                const { error } = action.payload;
                if (error === 'auth-failed' && action.payload.device) {
                    authFailed(state, action.payload.device);
                }
            }
        })
        .addCase(UI.REQUEST_PIN, state => {
            resetAuthFailed(state);
        })
        .addCase(deviceActions.receiveAuthConfirm, (state, { payload }) => {
            authConfirm(state, payload.device, payload.success);
        })
        .addCase(deviceActions.rememberDevice, (state, { payload }) => {
            remember(state, payload.device, payload.remember, payload.forceRemember);
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
        .addMatcher(
            isAnyOf(createDeviceInstanceThunk.fulfilled, createImportedDeviceThunk.fulfilled),
            (state, { payload }) => {
                createInstance(state, payload.device);
            },
        )
        .addMatcher(
            isAnyOf(deviceActions.connectDevice, deviceActions.connectUnacquiredDevice),
            (state, { payload: { device, settings } }) => {
                connectDevice(state, device, settings);
            },
        );
});

// Basic state selectors (no need to wrap in createMemoizedSelector)
export const selectDevices = (state: DeviceRootState) => state.device?.devices;
export const selectDevicesCount = (state: DeviceRootState) => state.device?.devices?.length;
export const selectDevice = (state: DeviceRootState) => state.device.selectedDevice;

// Derived selectors
export const selectIsPendingTransportEvent = createMemoizedSelector(
    [selectDevices],
    devices => devices.length < 1,
);

export const selectIsDeviceUnlocked = createMemoizedSelector(
    [selectDevice],
    device => !!device?.features?.unlocked,
);

export const selectDeviceAuthFailed = createMemoizedSelector(
    [selectDevice],
    device => !!device?.authFailed,
);

export const selectDeviceType = createMemoizedSelector([selectDevice], device => device?.type);

export const selectDeviceFeatures = createMemoizedSelector(
    [selectDevice],
    device => device?.features,
);

export const selectIsDeviceProtectedByPin = createMemoizedSelector(
    [selectDeviceFeatures],
    features => !!features?.pin_protection,
);

export const selectIsDeviceProtectedByPassphrase = createMemoizedSelector(
    [selectDeviceFeatures],
    features => !!features?.passphrase_protection,
);

export const selectIsDeviceProtectedByWipeCode = createMemoizedSelector(
    [selectDeviceFeatures],
    features => !!features?.wipe_code_protection,
);

export const selectDeviceButtonRequests = createMemoizedSelector(
    [selectDevice],
    device => device?.buttonRequests ?? [],
);

export const selectDeviceButtonRequestsCodes = createMemoizedSelector(
    [selectDeviceButtonRequests],
    buttonRequests =>
        pipe(
            buttonRequests.map(r => r.code),
            returnStableArrayIfEmpty,
        ),
);

export const selectDeviceMode = createMemoizedSelector([selectDevice], device => device?.mode);

export const selectIsUnacquiredDevice = createMemoizedSelector(
    [selectDeviceType],
    deviceType => deviceType === 'unacquired',
);

export const selectIsDeviceInBootloader = createMemoizedSelector(
    [selectDeviceMode],
    mode => mode === 'bootloader',
);

export const selectIsDeviceInitialized = createMemoizedSelector(
    [selectDeviceFeatures, selectDeviceMode],
    (features, mode) => {
        if (mode === 'initialize' || mode === 'seedless') return false;

        return !!features?.initialized;
    },
);

export const selectIsConnectedDeviceUninitialized = createMemoizedSelector(
    [selectDevice, selectIsDeviceInitialized],
    (device, isDeviceInitialized) => device && !isDeviceInitialized,
);

export const selectIsDeviceAuthorized = createMemoizedSelector(
    [selectDevice],
    device => !!device?.state,
);

export const selectHasDeviceAuthConfirm = createMemoizedSelector(
    [selectDevice],
    device => !!device?.authConfirm,
);

export const selectIsDeviceConnectedAndAuthorized = createMemoizedSelector(
    [selectIsDeviceAuthorized, selectDeviceFeatures],
    (isDeviceAuthorized, deviceFeatures) => isDeviceAuthorized && !!deviceFeatures,
);

export const selectDeviceInternalModel = createMemoizedSelector(
    [selectDevice],
    device => device?.features?.internal_model,
);

// Selectors with parameters should use WeakMap memoization
export const selectDeviceByState = createMemoizedSelector(
    [selectDevices, (_state, deviceState: DeviceState) => deviceState],
    (devices, deviceState) =>
        devices.find(d => d.state?.staticSessionId === deviceState.staticSessionId),
);

export const selectDeviceByStaticSessionId = createMemoizedSelector(
    [selectDevices, (_state, staticSessionId: StaticSessionId) => staticSessionId],
    (devices, staticSessionId) => devices.find(d => d.state?.staticSessionId === staticSessionId),
);

export const selectDeviceUnavailableCapabilities = createMemoizedSelector(
    [selectDevice],
    device => device?.unavailableCapabilities,
);

export const selectDeviceCapabilities = createMemoizedSelector(
    [selectDeviceFeatures],
    features => features?.capabilities,
);

export const selectHasDevicePassphraseEntryCapability = createMemoizedSelector(
    [selectDeviceCapabilities],
    capabilities => !!capabilities?.includes('Capability_PassphraseEntry'),
);

export const selectDeviceStatus = createMemoizedSelector(
    [selectDevice],
    device => device && getStatus(device),
);

export const selectDeviceSupportedNetworks = createMemoizedSelector([selectDevice], device => {
    const firmwareVersion = getFirmwareVersion(device);
    const result = Object.entries(networks)
        .filter(([symbol]) => {
            const unavailableCapability = device?.unavailableCapabilities?.[symbol];
            // if device does not have fw, do not show coins which are not supported by device in any case
            if (!firmwareVersion && unavailableCapability === 'no-support') {
                return false;
            }
            // if device has fw, do not show coins which are not supported by current fw
            if (
                firmwareVersion &&
                ['no-support', 'no-capability'].includes(unavailableCapability || '')
            ) {
                return false;
            }

            return true;
        })
        .map(([symbol]) => symbol as NetworkSymbol);

    return returnStableArrayIfEmpty(result);
});

export const selectDeviceById = createMemoizedSelector(
    [state => state.device.devices, (_state, deviceId: TrezorDevice['id']) => deviceId],
    (devices, deviceId) => devices.find(device => device.id === deviceId),
);

export const selectDeviceAuthenticity = createMemoizedSelector(
    [state => state.device.deviceAuthenticity],
    deviceAuthenticity => deviceAuthenticity,
);

export const selectSelectedDeviceAuthenticity = createMemoizedSelector(
    [selectDevice, selectDeviceAuthenticity],
    (device, deviceAuthenticity) => (device?.id ? deviceAuthenticity?.[device.id] : undefined),
);

export const selectIsFirmwareAuthenticityCheckDismissed = createMemoizedSelector(
    [selectDevice, state => state.device.dismissedSecurityChecks?.firmwareAuthenticity],
    (device, dismissedChecks) => !!(device?.id && dismissedChecks?.includes(device.id)),
);

export const selectIsPortfolioTrackerDevice = createMemoizedSelector(
    [selectDevice],
    device => device?.id === PORTFOLIO_TRACKER_DEVICE_ID,
);

export const selectDeviceLabel = createMemoizedSelector(
    [selectDevice],
    device => device?.features?.label,
);

export const selectDeviceName = createMemoizedSelector([selectDevice], device => device?.name);

export const selectDeviceLabelOrNameById = createMemoizedSelector(
    [state => state.device.devices, (_state, id: TrezorDevice['id']) => id],
    (devices, id) => {
        const device = devices.find(d => d.id === id);

        return device?.features?.label || device?.name || '';
    },
);

export const selectDeviceLabelOrName = createMemoizedSelector(
    [selectDevice, selectDevices],
    (selectedDevice, devices) => {
        const device = devices.find(d => d.id === selectedDevice?.id);

        return device?.features?.label || device?.name || '';
    },
);

export const selectDeviceId = createMemoizedSelector(
    [selectDevice],
    selectedDevice => selectedDevice?.id ?? null,
);

export const selectDeviceModelById = createMemoizedSelector(
    [state => state.device.devices, (_state, id: TrezorDevice['id']) => id],
    (devices, id) => {
        const device = devices.find(d => d.id === id);

        return device?.features?.internal_model ?? null;
    },
);

export const selectDeviceModel = createMemoizedSelector(
    [selectDevice],
    selectedDevice => selectedDevice?.features?.internal_model ?? null,
);

export const selectDeviceReleaseInfo = createMemoizedSelector(
    [selectDevice],
    device => device?.firmwareRelease ?? null,
);

export const selectDeviceFirmwareVersion = createMemoizedSelector([selectDevice], device =>
    getFirmwareVersionArray(device),
);

export const selectPhysicalDevices = createMemoizedSelector([selectDevices], devices =>
    pipe(
        devices,
        A.filter(device => device.id !== PORTFOLIO_TRACKER_DEVICE_ID),
        returnStableArrayIfEmpty,
    ),
);

export const selectIsNoPhysicalDeviceConnected = createMemoizedSelector(
    [selectPhysicalDevices],
    devices => devices.every(device => !device.connected),
);

export const selectHasOnlyPortfolioDevice = createMemoizedSelector(
    [selectDevices],
    devices => devices.length === 1 && devices[0].id === PORTFOLIO_TRACKER_DEVICE_ID,
);

export const selectIsDeviceBitcoinOnly = createMemoizedSelector(
    [selectDeviceFeatures],
    features => features?.unit_btconly ?? false,
);

export const selectDeviceLanguage = createMemoizedSelector(
    [selectDeviceFeatures],
    features => features?.language ?? null,
);

export const selectHasDeviceFirmwareInstalled = createMemoizedSelector(
    [selectDevice],
    device => !!device && device.firmware !== 'none',
);

export const selectIsDeviceRemembered = createMemoizedSelector(
    [selectDevice],
    device => !!device?.remember,
);

export const selectRememberedStandardWalletsCount = createMemoizedSelector(
    [selectPhysicalDevices],
    devices =>
        returnStableArrayIfEmpty(
            devices.filter(device => device.remember && device.useEmptyPassphrase),
        ).length,
);

export const selectRememberedHiddenWalletsCount = createMemoizedSelector(
    [selectPhysicalDevices],
    devices =>
        returnStableArrayIfEmpty(
            devices.filter(device => device.remember && !device.useEmptyPassphrase),
        ).length,
);

export const selectIsDeviceConnected = createMemoizedSelector(
    [selectDevice],
    device => !!device?.connected,
);

export const selectIsDeviceInViewOnlyMode = createMemoizedSelector(
    [selectIsDeviceConnected, selectIsDeviceRemembered],
    (isDeviceConnected, isDeviceRemembered) => !isDeviceConnected && isDeviceRemembered,
);

export const selectIsDeviceUsingPassphrase = createMemoizedSelector(
    [selectIsDeviceProtectedByPassphrase, selectDevice],
    (isDeviceProtectedByPassphrase, device) => {
        const shouldTreatAsPassphraseProtected = (device?.instance ?? 1) > 1;

        return (
            (isDeviceProtectedByPassphrase && device?.useEmptyPassphrase === false) ||
            shouldTreatAsPassphraseProtected
        );
    },
);

export const selectPhysicalDevicesGrouppedById = createMemoizedSelector(
    [selectPhysicalDevices],
    devices => returnStableArrayIfEmpty(deviceUtils.getDeviceInstancesGroupedByDeviceId(devices)),
);

export const selectDeviceState = createMemoizedSelector(
    [selectDevice],
    device => device?.state ?? null,
);

export const selectDeviceStaticSessionId = createMemoizedSelector(
    [selectDevice],
    device => device?.state?.staticSessionId ?? null,
);

export const selectDeviceInstances = createMemoizedSelector(
    [selectDevice, selectDevices],
    (device, allDevices) => {
        if (!device) {
            return [];
        }

        return pipe(getDeviceInstances(device, allDevices), returnStableArrayIfEmpty);
    },
);

export const selectNumberOfDeviceInstances = createMemoizedSelector(
    [selectDeviceInstances],
    deviceInstances => deviceInstances.length,
);

export const selectInstacelessUnselectedDevices = createMemoizedSelector(
    [selectDevice, selectDevices],
    (device, allDevices) =>
        pipe(
            deviceUtils.getSortedDevicesWithoutInstances(allDevices, device?.id),
            returnStableArrayIfEmpty,
        ),
);

export const selectIsBitcoinOnlyDevice = createMemoizedSelector([selectDevice], device =>
    isBitcoinOnlyDevice(device),
);

export const selectHasBitcoinOnlyFirmware = createMemoizedSelector([selectDevice], device =>
    hasBitcoinOnlyFirmware(device),
);
