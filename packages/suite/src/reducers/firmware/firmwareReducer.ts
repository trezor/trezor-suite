import produce from 'immer';
import { UI, Device } from 'trezor-connect';

import { FIRMWARE } from '@firmware-actions/constants';
import { SUITE } from '@suite-actions/constants';

import type { Action, AcquiredDevice } from '@suite-types';

type FirmwareUpdateCommon = {
    installingProgress?: number;
    hasSeed: boolean; // Stores confirmation from the user about having a seed card available when doing a fw update (check-seed step)
    targetRelease: AcquiredDevice['firmwareRelease'];
    prevDevice?: Device; // cached device for the purpose of fw update
    intermediaryInstalled: boolean; // Fresh unpacked T1 comes with 1.4.0 bootloader and will install intermediary fw, after the installation is complete it is set to true
    subsequentInstalling: boolean; // Used to reset state of progress bar when installing subsequent update right after an intermediary one
};

export type FirmwareUpdateState =
    | (FirmwareUpdateCommon & {
          error: undefined;
          status:
              | 'initial' // initial state
              | 'check-seed' // ask user, if has seed properly backed up
              | 'waiting-for-bootloader' // navigate user into bootloader mode
              | 'started' // progress - firmware update has started, waiting for events from trezor-connect
              | 'waiting-for-confirmation' // progress - device waits for confirmation prior starting to update
              | 'installing' // progress - firmware is being installed
              | 'partially-done' // progress - some old t1 firmwares can't update to the latest version. This should be handled by intermediary fw now and it shouldn't even be triggered in real world, but just to be safe let's keep it.
              | 'wait-for-reboot' // progress - model t2 is restarting after firmware update
              | 'unplug' // progress - user is asked to reconnect device (t1)
              | 'reconnect-in-normal' // progress - after unplugging device from previous step, user is asked to connect it again
              | 'done'; // firmware successfully installed
      })
    | (FirmwareUpdateCommon & {
          status: 'error';
          error: string;
      });

const initialState: FirmwareUpdateState = {
    status: 'initial',
    installingProgress: undefined,
    error: undefined,
    // we need to assess next firmware outside of bootloader mode for best results.
    // we actually can do it even in bl mode, but cant guarantee we will really get the
    // same firmware as was initially offered in 'firmware' mode.
    targetRelease: undefined,
    hasSeed: false,
    prevDevice: undefined,
    intermediaryInstalled: false,
    subsequentInstalling: false,
};

const firmwareUpdate = (state: FirmwareUpdateState = initialState, action: Action) =>
    produce(state, draft => {
        switch (action.type) {
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
                    // intermediary is already installed so latest release has to be used as new target release
                    draft.targetRelease.release = draft.targetRelease.latest;
                    draft.targetRelease.isLatest = true;
                }
                break;

            case SUITE.ADD_BUTTON_REQUEST:
                if (action.payload === 'ButtonRequest_FirmwareUpdate') {
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
            case FIRMWARE.RESET_REDUCER:
                return initialState;
            default:

            // no default
        }
    });

export default firmwareUpdate;
