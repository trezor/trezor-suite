import { UI, DEVICE, Device } from '@trezor/connect';
import { MODAL } from '@suite-actions/constants';
import { UserContextPayload } from '@suite-actions/modalActions';
import { Action, TrezorDevice } from '@suite-types';

export type State =
    | { context: typeof MODAL.CONTEXT_NONE }
    | {
          context: typeof MODAL.CONTEXT_DEVICE;
          device: TrezorDevice | Device;
          windowType?: string;
      }
    | {
          context: typeof MODAL.CONTEXT_DEVICE_CONFIRMATION;
          windowType: string;
      }
    | {
          context: typeof MODAL.CONTEXT_USER;
          payload: UserContextPayload;
      };

const initialState: State = {
    context: MODAL.CONTEXT_NONE,
};

const modalReducer = (state: State = initialState, action: Action): State => {
    switch (action.type) {
        // device with context assigned to modal was disconnected
        case DEVICE.DISCONNECT:
            if (
                (state.context === MODAL.CONTEXT_DEVICE &&
                    action.payload.path === state.device.path) ||
                state.context === MODAL.CONTEXT_USER
            ) {
                return initialState;
            }
            return state;
        // assign device to modal context
        case UI.REQUEST_PIN:
        case UI.INVALID_PIN:
        case UI.REQUEST_PASSPHRASE:
        case UI.REQUEST_PASSPHRASE_ON_DEVICE:
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
        case UI.FIRMWARE_PROGRESS:
            // firmware update first sends UI.REQUEST_BUTTON. Clear it after first progress is received
            return initialState;
        case UI.REQUEST_CONFIRMATION:
            return {
                context: MODAL.CONTEXT_DEVICE_CONFIRMATION,
                windowType: action.payload.view,
            };
        case UI.REQUEST_WORD:
            return {
                context: MODAL.CONTEXT_DEVICE,
                device: action.payload.device,
                windowType: action.payload.type,
            };

        case MODAL.OPEN_USER_CONTEXT:
            return {
                context: MODAL.CONTEXT_USER,
                payload: action.payload,
            };

        case MODAL.CLOSE:
        case UI.CLOSE_UI_WINDOW:
            return initialState;

        default:
            return state;
    }
};

export default modalReducer;
