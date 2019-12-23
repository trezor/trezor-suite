import { UI, DEVICE, Device } from 'trezor-connect';
import { MODAL, SUITE, DEVICE_SETTINGS, FIRMWARE } from '@suite-actions/constants';
import { ACCOUNT, RECEIVE } from '@wallet-actions/constants';
import { Action, TrezorDevice } from '@suite-types';

export type State =
    | { context: typeof MODAL.CONTEXT_NONE }
    | {
          context: typeof MODAL.CONTEXT_DEVICE;
          device: TrezorDevice | Device;
          windowType?: string;
          addressPath?: string;
      }
    | {
          context: typeof MODAL.CONTEXT_CONFIRMATION;
          windowType: string;
      }
    | {
          context: typeof MODAL.CONTEXT_EXTERNAL_WALLET;
          windowType?: string;
      }
    | {
          context: typeof MODAL.CONTEXT_SCAN_QR;
          outputId: number;
      };

const initialState: State = {
    context: MODAL.CONTEXT_NONE,
};

export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        // close modal if modal is not a 'device' context
        case DEVICE.CONNECT:
        case DEVICE.CONNECT_UNACQUIRED:
            if (state.context !== MODAL.CONTEXT_DEVICE) {
                return initialState;
            }
            return state;
        // device with context assigned to modal was disconnected
        case DEVICE.DISCONNECT:
            if (
                state.context === MODAL.CONTEXT_DEVICE &&
                action.payload.path === state.device.path
            ) {
                return initialState;
            }
            return state;
        // assign device to modal context
        case UI.REQUEST_PIN:
        case UI.INVALID_PIN:
        case UI.REQUEST_PASSPHRASE:
            return {
                context: MODAL.CONTEXT_DEVICE,
                device: action.payload.device,
                windowType: action.type,
            };
        case UI.REQUEST_BUTTON:
            return {
                context: MODAL.CONTEXT_DEVICE,
                device: action.payload.device,
                windowType: action.payload.code,
            };
        case UI.REQUEST_CONFIRMATION:
            return {
                context: MODAL.CONTEXT_CONFIRMATION,
                windowType: action.payload.view,
            };
        case SUITE.REQUEST_REMEMBER_DEVICE:
        case SUITE.REQUEST_DEVICE_INSTANCE:
        case SUITE.REQUEST_PASSPHRASE_MODE:
        case SUITE.REQUEST_DISCONNECT_DEVICE:
        case ACCOUNT.REQUEST_NEW_ACCOUNT:
        case DEVICE_SETTINGS.OPEN_BACKGROUND_GALLERY_MODAL:
        case FIRMWARE.INIT:
            return {
                context: MODAL.CONTEXT_DEVICE,
                device: action.payload,
                windowType: action.type,
            };
        case RECEIVE.REQUEST_UNVERIFIED:
            return {
                context: MODAL.CONTEXT_DEVICE,
                device: action.device,
                windowType: action.type,
                addressPath: action.addressPath,
            };
        // close modal
        case UI.CLOSE_UI_WINDOW:
        case MODAL.CLOSE:
        case SUITE.FORGET_DEVICE:
        case SUITE.FORGET_DEVICE_INSTANCE:
        case SUITE.REMEMBER_DEVICE:
            return initialState;

        // other contexts
        case MODAL.OPEN_SCAN_QR:
            return {
                context: MODAL.CONTEXT_SCAN_QR,
                outputId: action.outputId,
            };
        default:
            return state;
    }
};
