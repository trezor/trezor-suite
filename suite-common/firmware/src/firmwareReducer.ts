import { type PayloadAction, createSelector } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { type FirmwareStatus, type TrezorDevice } from '@suite-common/suite-types';
import {
    DEVICE,
    type DeviceButtonRequest,
    type FirmwareChannel,
    type FirmwareProgress,
    type FirmwareProgressUnexpectedDelay,
    type FirmwareReconnect,
    type FirmwareType,
    UI_REQUEST,
    type UiRequestConfirmation,
} from '@trezor/connect';

import { firmwareActions } from './firmwareActions';

type FirmwareUpdateUiEvent =
    | DeviceButtonRequest
    | FirmwareProgress
    | FirmwareReconnect
    | FirmwareProgressUnexpectedDelay;

type FirmwareUpdateCommon = {
    // Device before installation begun. Used to display the original firmware type and version during the installation.
    cachedDevice?: TrezorDevice;
    // Stores firmware type currently being installed so that it can be displayed to the user during installation
    targetType?: FirmwareType;
    useDevkit: boolean;
    uiEvent?: FirmwareUpdateUiEvent;
    firmwareChannel: FirmwareChannel;
    switchFirmwareType: boolean;
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
};
export const firmwareInitialState = initialState;

type RootState = {
    firmware: typeof initialState;
};

type StorageActionPayload = {
    firmware: {
        firmwareChannel: FirmwareChannel;
    };
};

export const prepareFirmwareReducer = createReducerWithExtraDeps(initialState, (builder, extra) => {
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
        .addMatcher<UiRequestConfirmation>(
            action => action.type === UI_REQUEST.REQUEST_CONFIRMATION,
            (state, action) => {
                if (state.status === 'started' && action.payload.view === 'thp-pairing-start') {
                    state.status = 'thp-pairing';
                }
            },
        )
        .addMatcher<FirmwareUpdateUiEvent>(
            (action: FirmwareUpdateUiEvent) =>
                action.type === UI_REQUEST.FIRMWARE_RECONNECT ||
                action.type === UI_REQUEST.FIRMWARE_PROGRESS ||
                action.type === UI_REQUEST.FIRMWARE_PROGRESS_UNEXPECTED_DELAY ||
                action.type === DEVICE.BUTTON,
            (state, action) => {
                // DEVICE.BUTTON can be dispatched outside the firmware update flow and that should not change the uiEvent,
                // otherwise it could result in confirmation pill being displayed unintentionally.
                if (!(action.type === DEVICE.BUTTON && state.status === 'initial')) {
                    state.uiEvent = action;
                }
            },
        );
});

export const selectFirmware = (state: RootState) => state.firmware;
export const selectUseDevkit = (state: RootState) => state.firmware.useDevkit;
export const selectFirmwareChannel = (state: RootState) => state.firmware.firmwareChannel;
export const selectSwitchFirmwareType = (state: RootState) => state.firmware.switchFirmwareType;

export const selectIsFirmwareInstallationRunning = (state: RootState) =>
    state.firmware.status === 'started';

export const selectEffectiveFirmwareChannel = (selectAllowPrerelease: (state: any) => boolean) =>
    createSelector(
        selectFirmwareChannel,
        selectAllowPrerelease,
        (firmwareChannel, allowPrerelease): FirmwareChannel =>
            // When a user is in the Early Access Program, the firmware channel is forced to `production-early-access`.
            // This factory accepts `selectAllowPrerelease` as a parameter because it is a platform-specific extra dependency.
            allowPrerelease ? 'production-early-access' : firmwareChannel,
    );

export const selectIsProductionFirmwareChannel = (selectAllowPrerelease: (state: any) => boolean) =>
    createSelector(
        selectEffectiveFirmwareChannel(selectAllowPrerelease),
        (firmwareChannel): boolean =>
            ['production', 'production-early-access'].includes(firmwareChannel),
    );
