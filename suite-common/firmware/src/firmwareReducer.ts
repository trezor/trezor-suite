import { type PayloadAction } from '@reduxjs/toolkit';

import {
    type DeviceRootState,
    getDeviceLabelOrName,
    getIsDeviceConnectedViaBluetoothLowOnBattery,
    selectDevices,
    selectSelectedDevice,
} from '@suite-common/device';
import {
    type ActionTypesDep,
    createReducerWithExtraDeps,
    createWeakMapSelector,
} from '@suite-common/redux-utils';
import { type FirmwareStatus, type TrezorDevice } from '@suite-common/suite-types';
import {
    DEVICE,
    type DeviceButtonRequest,
    type FirmwareChannel,
    type FirmwareType,
    UI_EVENTS,
    UI_REQUESTS,
    type UiEventFirmwareProgress,
    type UiEventFirmwareProgressUnexpectedDelay,
    type UiEventFirmwareReconnect,
    type UiRequestConfirmation,
} from '@trezor/connect';

import { type FirmwareDeviceRef, resolveDeviceByFirmwareRef } from './deviceRef/firmwareDeviceRef';
import {
    FirmwareDeviceTrackingPhase,
    type FirmwareDeviceTrackingState,
    firmwareDeviceTrackingInitialState,
    firmwareDeviceTrackingReducer,
} from './deviceRef/firmwareDeviceTracking';
import { firmwareActions } from './firmwareActions';

type FirmwareUpdateUiEvent =
    | DeviceButtonRequest
    | UiEventFirmwareProgress
    | UiEventFirmwareReconnect
    | UiEventFirmwareProgressUnexpectedDelay;

type FirmwareUpdateCommon = {
    // Device before installation begun. Used to display the original firmware type and version during the installation.
    cachedDevice?: TrezorDevice;
    // Stores firmware type currently being installed so that it can be displayed to the user during installation
    targetType?: FirmwareType;
    useDevkit: boolean;
    uiEvent?: FirmwareUpdateUiEvent;
    firmwareChannel: FirmwareChannel;
    switchFirmwareType: boolean;
    deviceTracking: FirmwareDeviceTrackingState;
};

export type FirmwareUpdateState =
    | (FirmwareUpdateCommon & {
          error: string | undefined;
          status: FirmwareStatus | 'error';
      })
    | (FirmwareUpdateCommon & {
          status: 'error';
          error: string;
      });

const initialState: FirmwareUpdateState = {
    status: 'initial',
    error: undefined,
    cachedDevice: undefined,
    targetType: undefined,
    useDevkit: false,
    uiEvent: undefined,
    firmwareChannel: 'production',
    switchFirmwareType: false, // NOTE: flag that indicates when the user intents to change the type of FW universal -> bitcoin-only
    deviceTracking: firmwareDeviceTrackingInitialState,
};
export const firmwareInitialState = initialState;

export type FirmwareRootState = {
    firmware: typeof initialState;
};

type StorageActionPayload = {
    firmware: {
        firmwareChannel: FirmwareChannel;
    };
};

type FirmwareReducerDeps = ActionTypesDep<'storageLoad'>;

export const prepareFirmwareReducer = createReducerWithExtraDeps(
    initialState,
    (builder, extra: FirmwareReducerDeps) => {
        builder
            .addCase(
                extra.actionTypes.storageLoad,
                (state, { payload }: PayloadAction<StorageActionPayload>) => {
                    if (payload.firmware) state.firmwareChannel = payload.firmware.firmwareChannel;
                },
            )
            .addCase(firmwareActions.setStatus, (state, { payload }) => {
                state.status = payload;
            })
            .addCase(firmwareActions.setSwitchFirmwareType, (state, { payload }) => {
                state.switchFirmwareType = payload;
            })
            .addCase(firmwareActions.setFirmwareUpdateError, (state, { payload }) => {
                state.error = payload;
                if (payload) {
                    state.status = 'error';
                }
                state.uiEvent = undefined;
            })
            .addCase(firmwareActions.setTargetType, (state, { payload }) => {
                state.targetType = payload;
            })
            .addCase(firmwareActions.resetReducer, state => ({
                ...initialState,
                firmwareChannel: state.firmwareChannel,
                useDevkit: state.useDevkit,
            }))
            .addCase(firmwareActions.toggleUseDevkit, (state, { payload }) => {
                state.useDevkit = payload;
            })
            .addCase(firmwareActions.cacheDevice, (state, { payload }) => {
                state.cachedDevice = payload;
            })
            .addCase(firmwareActions.setFirmwareChannel, (state, { payload }) => {
                state.firmwareChannel = payload;
            })
            .addCase(firmwareActions.armDeviceTracking, (state, { payload }) => {
                state.deviceTracking = firmwareDeviceTrackingReducer(state.deviceTracking, {
                    type: 'arm',
                    device: payload,
                });
            })
            .addCase(firmwareActions.trackedDeviceConnected, (state, { payload }) => {
                state.deviceTracking = firmwareDeviceTrackingReducer(state.deviceTracking, {
                    type: 'device-connect',
                    device: payload.device,
                    isOnlyCandidate: payload.isOnlyCandidate,
                });
            })
            .addCase(firmwareActions.trackedDeviceDisconnected, (state, { payload }) => {
                state.deviceTracking = firmwareDeviceTrackingReducer(state.deviceTracking, {
                    type: 'device-disconnect',
                    device: payload,
                });
            })
            .addMatcher<UiRequestConfirmation>(
                action => action.type === UI_REQUESTS.REQUEST_CONFIRMATION,
                (state, action) => {
                    if (state.status === 'started' && action.payload.view === 'thp-pairing-start') {
                        state.status = 'thp-pairing';
                    }
                },
            )
            .addMatcher<FirmwareUpdateUiEvent>(
                (action: FirmwareUpdateUiEvent) =>
                    action.type === UI_EVENTS.FIRMWARE_RECONNECT ||
                    action.type === UI_EVENTS.FIRMWARE_PROGRESS ||
                    action.type === UI_EVENTS.FIRMWARE_PROGRESS_UNEXPECTED_DELAY ||
                    action.type === DEVICE.BUTTON,
                (state, action) => {
                    // DEVICE.BUTTON can be dispatched outside the firmware update flow and that should not change the uiEvent,
                    // otherwise it could result in confirmation pill being displayed unintentionally.
                    if (!(action.type === DEVICE.BUTTON && state.status === 'initial')) {
                        state.uiEvent = action;
                    }
                },
            );
    },
);

export const selectFirmware = (state: FirmwareRootState) => state.firmware;
export const selectUseDevkit = (state: FirmwareRootState) => state.firmware.useDevkit;
export const selectFirmwareChannel = (state: FirmwareRootState) => state.firmware.firmwareChannel;
export const selectSwitchFirmwareType = (state: FirmwareRootState) =>
    state.firmware.switchFirmwareType;

export const selectIsFirmwareInstallationRunning = (state: FirmwareRootState) =>
    state.firmware.status === 'started';

/**
 * Whether the update has run to an end — installed, or failed and not going to retry itself.
 *
 * This is the only trustworthy "the update is over" signal. A `firmwareUpdate` call returning is
 * not: the manual reboot flow dispatches it twice, once to get the device into the bootloader and
 * once to install, so the first call resolves while the user is still at the reconnect prompt.
 */
export const selectIsFirmwareUpdateFinished = (state: FirmwareRootState) =>
    state.firmware.status === 'done' || state.firmware.status === 'error';

// When a user is in the Early Access Program, the firmware channel is forced to
// `production-early-access`. `allowPrerelease` is passed in as a parameter because it is a
// platform-specific extra dependency, not a part of the state.
export const selectEffectiveFirmwareChannel = (
    state: FirmwareRootState,
    allowPrerelease: boolean,
): FirmwareChannel => (allowPrerelease ? 'production-early-access' : selectFirmwareChannel(state));

export const selectIsProductionFirmwareChannel = (
    state: FirmwareRootState,
    allowPrerelease: boolean,
): boolean =>
    ['production', 'production-early-access'].includes(
        selectEffectiveFirmwareChannel(state, allowPrerelease),
    );

const createFirmwareSelector = createWeakMapSelector.withTypes<
    FirmwareRootState & DeviceRootState
>();

export const selectFirmwareDeviceTracking = (state: FirmwareRootState) =>
    state.firmware.deviceTracking;

export const selectFirmwareDeviceRef = (state: FirmwareRootState): FirmwareDeviceRef | undefined =>
    state.firmware.deviceTracking.currentRef;

export const selectIsFirmwareDeviceTrackingArmed = (state: FirmwareRootState) =>
    state.firmware.deviceTracking.phase !== FirmwareDeviceTrackingPhase.Idle;

/**
 * The physical device this firmware update is pinned to, or `undefined` when nothing is pinned.
 *
 * Resolves through the tracking ref and nothing else. It deliberately never falls back to the
 * globally selected device: while the device reboots, its entry is dropped from the device list and
 * the selection moves to whatever else is around (a remembered wallet of the same model, typically)
 * — reporting on that device instead of the one being updated is the whole bug this replaces.
 *
 * `undefined` therefore means "our device is not reachable right now", which callers must handle.
 * For rendering the device a firmware flow is *about*, use `selectFirmwareOriginalDevice`.
 */
export const selectFirmwareDevice = createFirmwareSelector(
    [selectDevices, selectFirmwareDeviceRef],
    (devices, ref) => resolveDeviceByFirmwareRef({ devices, ref }),
);

/**
 * The device a firmware flow is about, for display and for pre-flight checks.
 *
 * Prefers the snapshot taken when the installation began, so the UI can keep showing the firmware
 * version and type the user is upgrading from once the device is in bootloader mode reporting
 * nothing. Before an update is pinned there is nothing to resolve, so it follows the selection —
 * which is what the screens ahead of the install button are showing anyway, and what the mobile
 * app, which never pins a device, uses throughout.
 */
export const selectFirmwareOriginalDevice = createFirmwareSelector(
    [state => state.firmware.cachedDevice, selectFirmwareDevice, selectSelectedDevice],
    (cachedDevice, firmwareUpdateDevice, selectedDevice) =>
        cachedDevice ?? firmwareUpdateDevice ?? selectedDevice,
);

export const selectFirmwareDeviceLabelOrName = createFirmwareSelector(
    [selectFirmwareOriginalDevice],
    getDeviceLabelOrName,
);

/**
 * Battery state of the device the firmware flow is about, rather than of whatever is selected.
 * Starting an update on a device that is about to die is what this gate prevents, so it has to be
 * asked about the right device — and it is asked before the update pins one.
 */
export const selectIsFirmwareDeviceLowOnBattery = createFirmwareSelector(
    [selectFirmwareOriginalDevice],
    getIsDeviceConnectedViaBluetoothLowOnBattery,
);
