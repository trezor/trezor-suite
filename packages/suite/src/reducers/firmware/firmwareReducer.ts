import produce from 'immer';
import { UI, DEVICE, Device } from 'trezor-connect';
import { FIRMWARE } from '@firmware-actions/constants';
import { SUITE } from '@suite-actions/constants';
import { Action, AcquiredDevice } from '@suite-types';

export interface FirmwareUpdateState {
    status:
        | 'initial' // initial state
        | 'check-seed' // ask user, if has seed properly backed up
        | 'waiting-for-bootloader' // navigate user into bootloader mode
        | 'started' // progress - ??
        | 'downloading' // progress - firmware is being downloaded
        | 'waiting-for-confirmation' // progress - device waits for confirmation prior starting to update
        | 'installing' // progress - firmware is being installed
        | 'check-fingerprint' // progress - some old t1 firmwares show screen with fingerprint check
        | 'partially-done' // progress - some old t1 firmwares can't update to the latest version
        | 'wait-for-reboot' // progress - model t2 is restarting after firmware update
        | 'unplug' // progress - user is asked to reconnect device (t1)
        | 'reconnect-in-normal' // progress - after unplugging device from previous step, user is asked to connect it again
        | 'done' // firmware successfully installed
        | 'error';
    installingProgress?: number;
    error?: string;
    btcOnly: boolean;
    hasSeed: boolean;
    targetRelease: AcquiredDevice['firmwareRelease'];
    prevDevice?: Device;
}

const initialState: FirmwareUpdateState = {
    status: 'initial',
    installingProgress: undefined,
    error: undefined,
    // user selects whether wants btc only variant or not.
    btcOnly: false,
    // we need to assess next firmware outside of bootloader mode for best results.
    // we actually can do it even in bl mode, but cant guarantee we will really get the
    // same firmware as was initially offered in 'firmware' mode.
    targetRelease: undefined,
    hasSeed: false,
    prevDevice: undefined,
};

const firmwareUpdate = (state: FirmwareUpdateState = initialState, action: Action) => {
    return produce(state, draft => {
        switch (action.type) {
            case FIRMWARE.SET_UPDATE_STATUS:
                draft.status = action.payload;
                break;
            case FIRMWARE.SET_ERROR:
                draft.status = 'error';
                draft.error = action.payload;
                break;
            case FIRMWARE.SET_TARGET_RELEASE:
                draft.targetRelease = action.payload;
                break;
            case FIRMWARE.TOGGLE_HAS_SEED:
                draft.hasSeed = !state.hasSeed;
                break;

            case SUITE.ADD_BUTTON_REQUEST:
                if (action.payload === 'ButtonRequest_FirmwareUpdate') {
                    draft.status = 'waiting-for-confirmation';
                }
                if (action.payload === 'ButtonRequest_FirmwareCheck') {
                    draft.status = 'check-fingerprint';
                }
                break;
            case UI.FIRMWARE_PROGRESS:
                draft.installingProgress = action.payload.progress;
                draft.status = 'installing';
                break;
            case FIRMWARE.RESET_REDUCER:
                return initialState;
            case DEVICE.DISCONNECT:
                draft.prevDevice = action.payload;
                break;
            default:

            // no default
        }
    });
};

export default firmwareUpdate;
