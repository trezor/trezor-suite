import { PayloadAction } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { FirmwareStatus, TrezorDevice } from '@suite-common/suite-types';
import {
    DEVICE,
    DeviceButtonRequest,
    FirmwareProgress,
    FirmwareProgressUnexpectedDelay,
    FirmwareReconnect,
    FirmwareType,
    UI,
} from '@trezor/connect';
import { FirmwareUpdateSource } from '@trezor/connect/src/data/firmwareInfo';

import { firmwareActions } from './firmwareActions';

type FirmwwareUpdateUiEvent =
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
    uiEvent?: FirmwwareUpdateUiEvent;
    firmwareUpdateSource: FirmwareUpdateSource;
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
    firmwareUpdateSource: 'production',
};

type RootState = {
    firmware: typeof initialState;
};

type StorageActionPayload = {
    firmware: {
        firmwareUpdateSource: FirmwareUpdateSource;
    };
};

export const prepareFirmwareReducer = createReducerWithExtraDeps(initialState, (builder, extra) => {
    builder
        .addCase(
            extra.actionTypes.storageLoad,
            (state, { payload }: PayloadAction<StorageActionPayload>) => {
                if (payload.firmware)
                    state.firmwareUpdateSource = payload.firmware.firmwareUpdateSource;
            },
        )
        .addCase(firmwareActions.setStatus, (state, { payload }) => {
            state.status = payload;
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
            useDevkit: state.useDevkit,
        }))
        .addCase(firmwareActions.toggleUseDevkit, (state, { payload }) => {
            state.useDevkit = payload;
        })
        .addCase(firmwareActions.cacheDevice, (state, { payload }) => {
            state.cachedDevice = payload;
        })
        .addCase(firmwareActions.setFirmwareUpdateSource, (state, { payload }) => {
            state.firmwareUpdateSource = payload;
        })
        .addMatcher<FirmwwareUpdateUiEvent>(
            (action: FirmwwareUpdateUiEvent) =>
                action.type === UI.FIRMWARE_RECONNECT ||
                action.type === UI.FIRMWARE_PROGRESS ||
                action.type === UI.FIRMWARE_PROGRESS_UNEXPECTED_DELAY ||
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
export const selectFirmwareUpdateSource = (state: RootState) => state.firmware.firmwareUpdateSource;
