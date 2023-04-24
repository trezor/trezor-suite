import produce from 'immer';
import { UI, Device } from '@trezor/connect';

import { FIRMWARE } from '@firmware-actions/constants';
import { SUITE, STORAGE } from '@suite-actions/constants';

import type { Action, AcquiredDevice, FirmwareType } from '@suite-types';

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
    // Fresh unpacked T1 comes with 1.4.0 bootloader and will install intermediary fw, after the installation is complete it is set to true
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
    | 'partially-done' // progress - some old T1 firmwares can't update to the latest version. This should be handled by intermediary fw now and it shouldn't even be triggered in real world, but just to be safe let's keep it.
    | 'wait-for-reboot' // progress - models TT and T2B1 are restarting after firmware update
    | 'unplug' // progress - user is asked to reconnect device (T1)
    | 'reconnect-in-normal' // progress - after unplugging device from previous step, user is asked to connect it again
    | 'validation' // firmware validation in progress
    | 'done'; // firmware successfully installed

export type FirmwareUpdateState =
    | (FirmwareUpdateCommon & {
          error: undefined;
          status: FirmwareStatus;
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

const firmwareUpdate = (
    state: FirmwareUpdateState = initialState,
    action: Action,
): FirmwareUpdateState =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                if (action.payload.firmware?.firmwareHashInvalid) {
                    draft.firmwareHashInvalid = action.payload.firmware.firmwareHashInvalid;
                }
                break;
            case FIRMWARE.SET_UPDATE_STATUS:
                draft.status = action.payload;
                if (action.payload === 'started') {
                    if (draft.intermediaryInstalled) {
                        // Once intermediary fw is installed we trigger installation of subsequent fw update,
                        // It will set firmware.status to 'started' again and this will make sure the progress will be restarted
                        // even before we get UI.FIRMWARE_PROGRESS (which will be fired later)
                        draft.installingProgress = 0;
                        draft.subsequentInstalling = true;
                    }
                    draft.error = undefined;
                }
                break;
            case FIRMWARE.SET_HASH:
                draft.firmwareHash = action.payload.hash;
                draft.firmwareChallenge = action.payload.challenge;
                break;
            case FIRMWARE.SET_HASH_INVALID:
                draft.firmwareHashInvalid.push(action.payload);
                draft.status = 'error';
                break;
            case FIRMWARE.SET_ERROR:
                draft.error = action.payload;
                if (action.payload) {
                    draft.status = 'error';
                }
                break;
            case FIRMWARE.SET_TARGET_RELEASE:
                draft.targetRelease = action.payload;
                break;
            case FIRMWARE.TOGGLE_HAS_SEED:
                draft.hasSeed = !state.hasSeed;
                break;
            case FIRMWARE.SET_INTERMEDIARY_INSTALLED:
                draft.intermediaryInstalled = action.payload;
                if (draft.targetRelease) {
                    delete draft.targetRelease.intermediaryVersion;
                }
                break;
            case FIRMWARE.SET_TARGET_TYPE:
                draft.targetType = action.payload;
                break;
            case SUITE.ADD_BUTTON_REQUEST:
                if (action.payload?.code === 'ButtonRequest_FirmwareUpdate') {
                    draft.status = 'waiting-for-confirmation';
                }
                break;
            case UI.FIRMWARE_PROGRESS:
                draft.installingProgress = action.payload.progress;
                draft.status = 'installing';
                break;
            case FIRMWARE.REMEMBER_PREVIOUS_DEVICE:
                draft.prevDevice = action.payload;
                break;
            case FIRMWARE.SET_IS_CUSTOM:
                draft.isCustom = action.payload;
                break;
            case FIRMWARE.RESET_REDUCER:
                return {
                    ...initialState,
                    firmwareHashInvalid: draft.firmwareHashInvalid,
                    useDevkit: draft.useDevkit,
                };
            case FIRMWARE.TOGGLE_USE_DEVKIT:
                draft.useDevkit = action.payload;
                break;
            default:

            // no default
        }
    });

export default firmwareUpdate;
