import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { FirmwareStatus, TrezorDevice } from '@suite-common/suite-types';
import {
    DEVICE,
    DeviceButtonRequest,
    FirmwareProgress,
    FirmwareReconnect,
    FirmwareType,
    UI,
} from '@trezor/connect';

import { firmwareActions } from './firmwareActions';

type FirmwareUpdateCommon = {
    // Device before installation begun. Used to display the original firmware type and version during the installation.
    cachedDevice?: TrezorDevice;
    // Stores firmware type currently being installed so that it can be displayed to the user during installation
    targetType?: FirmwareType;
    useDevkit: boolean;
    uiEvent?: DeviceButtonRequest | FirmwareProgress | FirmwareReconnect;
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
};

type RootState = {
    firmware: typeof initialState;
};

export const prepareFirmwareReducer = createReducerWithExtraDeps(initialState, builder => {
    builder
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
        .addMatcher<FirmwareProgress | FirmwareReconnect | DeviceButtonRequest>(
            action =>
                action.type === UI.FIRMWARE_RECONNECT ||
                action.type === UI.FIRMWARE_PROGRESS ||
                action.type === DEVICE.BUTTON,
            (state, action) => {
                // DEVICE.BUTTON can be dispatched outside of the firmware update flow and that should not change the uiEvent,
                // otherwise it could result in confirmation pill being displayed unintentionally.
                if (!(action.type === DEVICE.BUTTON && state.status === 'initial'))
                    state.uiEvent = action;
            },
        );
});

export const selectFirmware = (state: RootState) => state.firmware;
export const selectUseDevkit = (state: RootState) => state.firmware.useDevkit;
export const selectCachedDevice = (state: RootState) => state.firmware.cachedDevice;
