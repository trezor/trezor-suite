import produce from 'immer';
import { UI } from 'trezor-connect';
import { FIRMWARE } from '@firmware-actions/constants';
import { SUITE } from '@suite-actions/constants';
import { Action, AcquiredDevice } from '@suite-types';

const INITIAL = 'initial';
const CHECK_SEED = 'check-seed';
const WAITING_FOR_BOOTLOADER = 'waiting-for-bootloader';
const STARTED = 'started';
const DOWNLOADING = 'downloading';
const WAITING_FOR_CONFIRMATION = 'waiting-for-confirmation';
const INSTALLING = 'installing';
const PARTIALLY_DONE = 'partially-done';
const DONE = 'done';
const WAIT_FOR_REBOOT = 'wait-for-reboot';
const UNPLUG = 'unplug';
const ERROR = 'error';

export type AnyStatus =
    | typeof INITIAL
    | typeof CHECK_SEED
    | typeof WAITING_FOR_BOOTLOADER
    | typeof STARTED
    | typeof DOWNLOADING
    | typeof WAITING_FOR_CONFIRMATION
    | typeof INSTALLING
    | typeof WAIT_FOR_REBOOT
    | typeof UNPLUG
    | typeof ERROR
    | typeof PARTIALLY_DONE
    | typeof DONE;

export interface FirmwareUpdateState {
    status: AnyStatus;
    installingProgress?: number;
    error?: string;
    btcOnly: boolean;
    targetRelease: AcquiredDevice['firmwareRelease'];
}

const initialState: FirmwareUpdateState = {
    status: INITIAL,
    installingProgress: undefined,
    error: undefined,
    // user selects wheter wants btc only variant or not.
    btcOnly: false,
    // we need to assess next firmware outside of bootloader mode for best results.
    // we actually can do it even in bl mode, but cant guarantee we will really get the
    // same firmware as was initially offered in 'firmware' mode.
    targetRelease: undefined,
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
            case FIRMWARE.TOGGLE_BTC_ONLY:
                draft.btcOnly = !state.btcOnly;
                break;
            case SUITE.ADD_BUTTON_REQUEST:
                if (action.payload === 'ButtonRequest_FirmwareUpdate') {
                    draft.status = WAITING_FOR_CONFIRMATION;
                }
                break;
            case UI.FIRMWARE_PROGRESS:
                draft.installingProgress = action.payload.progress;
                draft.status = 'installing';
                break;
            case FIRMWARE.RESET_REDUCER:
                return initialState;
            default:
            // no default
        }
    });
};

export default firmwareUpdate;
