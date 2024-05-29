import { FirmwareStatus, TrezorDevice } from '@suite-common/suite-types';
import {
    FirmwareType,
    UI,
    DEVICE,
    FirmwareProgress,
    FirmwareReconnect,
    DeviceButtonRequest,
} from '@trezor/connect';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { firmwareActions } from './firmwareActions';
import { deviceActions } from '../device/deviceActions';

type FirmwareUpdateCommon = {
    // Device before installation begun. Used to display the original firmware type and version during the installation.
    cachedDevice?: TrezorDevice;
    // Stores firmware type currently being installed so that it can be displayed to the user during installation
    targetType?: FirmwareType;
    // Array of device ids where suite claims their firmware might have been "hacked". This information is available only after firmware update is finished
    // and we need to store this information persistently so that it does not disappear after accidental device reconnection.
    // todo: in the future we might implement additional check that will validate firmware after every connection
    //  todo: !
    firmwareHashInvalid: string[];
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
    firmwareHashInvalid: [],
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
            state.uiEvent = undefined;
        })
        .addCase(firmwareActions.setTargetType, (state, { payload }) => {
            state.targetType = payload;
        })
        .addCase(firmwareActions.resetReducer, state => ({
            ...initialState,
            firmwareHashInvalid: state.firmwareHashInvalid,
            useDevkit: state.useDevkit,
        }))
        .addCase(firmwareActions.toggleUseDevkit, (state, { payload }) => {
            state.useDevkit = payload;
        })
        .addCase(firmwareActions.cacheDevice, (state, { payload }) => {
            state.cachedDevice = payload;
        })
        .addCase(deviceActions.addButtonRequest, extra.reducers.addButtonRequestFirmware)
        .addMatcher(
            action => action.type === extra.actionTypes.storageLoad,
            extra.reducers.storageLoadFirmware,
        )
        .addMatcher<FirmwareProgress | FirmwareReconnect | DeviceButtonRequest>(
            action =>
                action.type === UI.FIRMWARE_RECONNECT ||
                action.type === UI.FIRMWARE_PROGRESS ||
                action.type === DEVICE.BUTTON,
            (state, action) => {
                state.uiEvent = action;
            },
        );
});

export const selectFirmware = (state: RootState) => state.firmware;
export const selectUseDevkit = (state: RootState) => state.firmware.useDevkit;
export const selectCachedDevice = (state: RootState) => state.firmware.cachedDevice;
