import produce from 'immer';
import { UI } from 'trezor-connect';
import { FIRMWARE } from '@settings-actions/constants';
import { Action } from '@suite-types';

const INITIAL = 'initial';
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
    userConfirmedSeed: boolean;
}

const initialState: FirmwareUpdateState = {
    status: INITIAL,
    installingProgress: undefined,
    error: undefined,
    userConfirmedSeed: false,
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
            case UI.REQUEST_BUTTON:
                if (action.payload && action.payload.code === 'ButtonRequest_FirmwareUpdate') {
                    draft.status = WAITING_FOR_CONFIRMATION;
                }
                break;
            case UI.FIRMWARE_PROGRESS:
                draft.installingProgress = action.payload.progress;
                draft.status = 'installing';
                break;
            case FIRMWARE.RESET_REDUCER:
                return initialState;
            case FIRMWARE.CONFIRM_SEED:
                draft.userConfirmedSeed = action.payload;
                draft.status = WAITING_FOR_BOOTLOADER;
                break;
            default:
            // no default
        }
    });
};

export default firmwareUpdate;
