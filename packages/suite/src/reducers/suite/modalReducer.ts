import { UI, DEVICE, Device } from 'trezor-connect';
import { MODAL, SUITE } from '@suite-actions/constants';
import { ACCOUNT } from '@wallet-actions/constants';
import { Action, TrezorDevice } from '@suite-types';

export type State =
    | { context: typeof MODAL.CONTEXT_NONE }
    | {
          context: typeof MODAL.CONTEXT_DEVICE;
          device: TrezorDevice | Device;
          windowType?: string;
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
        // TODO: case RECEIVE.REQUEST_UNVERIFIED:
        case SUITE.REQUEST_REMEMBER_DEVICE:
        case SUITE.REQUEST_FORGET_DEVICE:
        case SUITE.REQUEST_DEVICE_INSTANCE:
        case SUITE.REQUEST_PASSPHRASE_MODE:
        case ACCOUNT.REQUEST_NEW_ACCOUNT:
            return {
                context: MODAL.CONTEXT_DEVICE,
                device: action.payload,
                windowType: action.type,
            };
        // close modal
        // case UI.CLOSE_UI_WINDOW: // TODO: this brakes few things (remember when discovery is running)
        case MODAL.CLOSE:
        case SUITE.AUTH_DEVICE:
        case SUITE.FORGET_DEVICE:
        case SUITE.FORGET_DEVICE_INSTANCE:
        case SUITE.REMEMBER_DEVICE:
            return initialState;

        // other contexts
        case MODAL.OPEN_EXTERNAL_WALLET:
            return {
                context: MODAL.CONTEXT_EXTERNAL_WALLET,
                windowType: action.id,
            };
        case MODAL.OPEN_SCAN_QR:
            return {
                context: MODAL.CONTEXT_SCAN_QR,
            };

        default:
            return state;
    }
};
