import type { AcquiredDevice, FirmwareType, TrezorDevice } from 'src/types/suite';
import { firmwareActions } from 'src/actions/firmware/firmwareActions';
import { isAnyOf, PayloadAction } from '@reduxjs/toolkit';
import { AppState, ButtonRequest } from 'src/types/suite';
import { addButtonRequest } from 'src/actions/suite/suiteActions';

import { Device, UI } from '@trezor/connect';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

type RootState = Pick<AppState, 'firmware'>;

type FirmwareUpdateCommon = {
    installingProgress?: number;
    // Stores confirmation from the user about having a seed card available when doing a fw update (check-seed step)
    hasSeed: boolean;
    // we need to assess next firmware outside of bootloader mode for best results.
    // we actually can do it even in bl mode, but cant guarantee we will really get the
    // same firmware as was initially offered in 'firmware' mode.
    targetRelease: AcquiredDevice['firmwareRelease'];
    // Stores firmware type currently being installed so that it can be displayed to the user during installation
    targetType?: FirmwareType;
    // cached device for the purpose of fw update
    prevDevice?: Device;
    // Fresh unpacked T1B1 comes with 1.4.0 bootloader and will install intermediary fw, after the installation is complete it is set to true
    intermediaryInstalled: boolean;
    // Used to reset state of progress bar when installing subsequent update right after an intermediary one
    subsequentInstalling: boolean;
    firmwareHash?: string;
    firmwareChallenge?: string;
    // Array of device ids where suite claims their firmware might have been "hacked". This information is available only after firmware update is finished
    // and we need to store this information persistently so that it does not disappear after accidental device reconnection.
    // todo: in the future we might implement additional check that will validate firmware after every connection
    firmwareHashInvalid: string[];
    isCustom: boolean;
    useDevkit: boolean;
};

export type FirmwareStatus =
    | 'initial' // initial state
    | 'check-seed' // ask user, if has seed properly backed up
    | 'waiting-for-bootloader' // navigate user into bootloader mode
    | 'started' // progress - firmware update has started, waiting for events from trezor-connect
    | 'waiting-for-confirmation' // progress - device waits for confirmation prior starting to update
    | 'installing' // progress - firmware is being installed
    | 'partially-done' // progress - some old T1B1 firmwares can't update to the latest version. This should be handled by intermediary fw now and it shouldn't even be triggered in real world, but just to be safe let's keep it.
    | 'wait-for-reboot' // progress - models T2T1 and T2B1 are restarting after firmware update
    | 'unplug' // progress - user is asked to reconnect device (T1B1)
    | 'reconnect-in-normal' // progress - after unplugging device from previous step, user is asked to connect it again
    | 'validation' // firmware validation in progress
    | 'done'; // firmware successfully installed

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
    installingProgress: undefined,
    error: undefined,
    targetRelease: undefined,
    targetType: undefined,
    hasSeed: false,
    prevDevice: undefined,
    intermediaryInstalled: false,
    subsequentInstalling: false,
    firmwareHashInvalid: [],
    isCustom: false,
    useDevkit: false,
};

export const prepareFirmwareReducer = createReducerWithExtraDeps(initialState, (builder, extra) => {
    builder
        .addCase(firmwareActions.setStatus, (state, { payload }) => {
            state.status = payload;
            if (payload === 'started') {
                if (state.intermediaryInstalled) {
                    // Once intermediary fw is installed we trigger installation of subsequent fw update,
                    // It will set firmware.status to 'started' again and this will make sure the progress will be restarted
                    // even before we get UI.FIRMWARE_PROGRESS (which will be fired later)
                    state.installingProgress = 0;
                    state.subsequentInstalling = true;
                }
                state.error = undefined;
            }
        })
        .addCase(firmwareActions.setHash, (state, { payload }) => {
            state.firmwareHash = payload.hash;
            state.firmwareChallenge = payload.challenge;
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
        .addCase(firmwareActions.setTargetRelease, (state, { payload }) => {
            state.targetRelease = payload;
        })
        .addCase(firmwareActions.toggleHasSeed, state => {
            state.hasSeed = !state.hasSeed;
        })
        .addCase(
            firmwareActions.setIntermediaryInstalled,
            (state, { payload }: PayloadAction<boolean>) => {
                state.intermediaryInstalled = payload;
                if (state.targetRelease) {
                    delete state.targetRelease.intermediaryVersion;
                }
            },
        )
        .addCase(firmwareActions.setTargetType, (state, { payload }) => {
            state.targetType = payload;
        })
        .addCase(firmwareActions.rememberPreviousDevice, (state, { payload }) => {
            state.prevDevice = payload;
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
        .addMatcher(
            isAnyOf(addButtonRequest),
            (
                state,
                {
                    payload,
                }: PayloadAction<{
                    device?: TrezorDevice;
                    buttonRequest: ButtonRequest;
                }>,
            ) => {
                if (payload.buttonRequest?.code === 'ButtonRequest_FirmwareUpdate') {
                    state.status = 'waiting-for-confirmation';
                }
            },
        )
        .addMatcher(
            action => action.type === UI.FIRMWARE_PROGRESS,
            (state, action) => {
                state.installingProgress = action.payload.progress;
                state.status = 'installing';
            },
        )
        .addMatcher(
            action => action.type === extra.actionTypes.storageLoad,
            extra.reducers.storageLoadFirmware,
        );
});

export const selectFirmware = (state: RootState) => state.firmware;
export const selectTargetRelease = (state: RootState) => state.firmware.targetRelease;
export const selectPrevDevice = (state: RootState) => state.firmware.prevDevice;
export const selectUseDevkit = (state: RootState) => state.firmware.useDevkit;
export const selectIntermediaryInstalled = (state: RootState) =>
    state.firmware.intermediaryInstalled;
export const selectFirmwareChallenge = (state: RootState) => state.firmware.firmwareChallenge;
export const selectFirmwareHash = (state: RootState) => state.firmware.firmwareHash;
export const selectIsCustomFirmware = (state: RootState) => state.firmware.isCustom;
