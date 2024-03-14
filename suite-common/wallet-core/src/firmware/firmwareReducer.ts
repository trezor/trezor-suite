import { FirmwareStatus } from '@suite-common/suite-types';
import {
    FirmwareType,
    UI,
    DEVICE,
    FirmwareProgress,
    FirmwareDisconnect,
    FirmwareReconnect,
    DeviceButtonRequest,
} from '@trezor/connect';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { firmwareActions } from './firmwareActions';
import { deviceActions } from '../device/deviceActions';

type FirmwareUpdateCommon = {
    // Stores confirmation from the user about having a seed card available when doing a fw update (check-seed step)
    hasSeed: boolean;
    // Stores firmware type currently being installed so that it can be displayed to the user during installation
    targetType?: FirmwareType;
    // Array of device ids where suite claims their firmware might have been "hacked". This information is available only after firmware update is finished
    // and we need to store this information persistently so that it does not disappear after accidental device reconnection.
    // todo: in the future we might implement additional check that will validate firmware after every connection
    //  todo: !
    firmwareHashInvalid: string[];
    isCustom: boolean;
    useDevkit: boolean;
    uiEvent?: DeviceButtonRequest | FirmwareProgress | FirmwareDisconnect | FirmwareReconnect;
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
    targetType: undefined,
    hasSeed: false,
    firmwareHashInvalid: [],
    isCustom: false,
    useDevkit: false,
    uiEvent: undefined,
};

type RootState = {
    firmware: typeof initialState;
};

export const prepareFirmwareReducer = createReducerWithExtraDeps(initialState, (builder, extra) => {
    builder
        .addCase(firmwareActions.setStatus, (state, { payload }) => {
            state.status = payload;
        })
        .addCase(firmwareActions.setHashInvalid, (state, { payload }) => {
            state.firmwareHashInvalid.push(payload);
            state.status = 'error';
        })
        .addCase(firmwareActions.setError, (state, { payload }) => {
            state.error = payload;
            if (payload) {
                state.status = 'error';
            }
        })
        .addCase(firmwareActions.toggleHasSeed, state => {
            state.hasSeed = !state.hasSeed;
        })
        .addCase(firmwareActions.setTargetType, (state, { payload }) => {
            state.targetType = payload;
        })
        .addCase(firmwareActions.setIsCustomFirmware, (state, { payload }) => {
            state.isCustom = payload;
        })
        .addCase(firmwareActions.resetReducer, state => ({
            ...initialState,
            firmwareHashInvalid: state.firmwareHashInvalid,
            useDevkit: state.useDevkit,
        }))
        .addCase(firmwareActions.toggleUseDevkit, (state, { payload }) => {
            state.useDevkit = payload;
        })
        .addCase(deviceActions.addButtonRequest, extra.reducers.addButtonRequestFirmware)
        .addMatcher(
            action => action.type === extra.actionTypes.storageLoad,
            extra.reducers.storageLoadFirmware,
        )
        .addMatcher(
            action =>
                action.type === UI.FIRMWARE_RECONNECT ||
                action.type === UI.FIRMWARE_DISCONNECT ||
                action.type === UI.FIRMWARE_PROGRESS ||
                action.type === DEVICE.BUTTON,
            (state, action) => {
                state.uiEvent = action;
            },
        );
});

export const selectFirmware = (state: RootState) => state.firmware;
export const selectUseDevkit = (state: RootState) => state.firmware.useDevkit;
export const selectIsCustomFirmware = (state: RootState) => state.firmware.isCustom;
