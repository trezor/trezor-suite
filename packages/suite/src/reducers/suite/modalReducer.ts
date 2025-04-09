import { UserContextPayload } from '@suite-common/suite-types';
import {
    DEVICE,
    Device,
    UI,
    UiRequestButtonData,
    UiRequestConfirmation,
    UiRequestSelectAccount,
    UiRequestSelectFee,
} from '@trezor/connect';

import { MODAL } from 'src/actions/suite/constants';
import type { Action, TrezorDevice } from 'src/types/suite';

export type State = ModalState & { preserve?: boolean };

type ModalState =
    | { context: typeof MODAL.CONTEXT_NONE }
    | {
          context: typeof MODAL.CONTEXT_DEVICE;
          device: TrezorDevice | Device;
          windowType?: string;
          data?: UiRequestButtonData;
      }
    | {
          context: typeof MODAL.CONTEXT_DEVICE_CONFIRMATION;
          windowType: typeof UI.SELECT_ACCOUNT;
          data?: UiRequestSelectAccount['payload'];
      }
    | {
          context: typeof MODAL.CONTEXT_DEVICE_CONFIRMATION;
          windowType: typeof UI.SELECT_FEE;
          data?: UiRequestSelectFee['payload'];
      }
    | {
          context: typeof MODAL.CONTEXT_DEVICE_CONFIRMATION;
          windowType: UiRequestConfirmation['payload']['view'];
          data?: undefined;
      }
    | {
          context: typeof MODAL.CONTEXT_USER;
          payload: UserContextPayload;
      };

type ModalRootState = {
    modal: ModalState;
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
                preserve: state.preserve,
            };
        case UI.REQUEST_BUTTON:
            return {
                context: MODAL.CONTEXT_DEVICE,
                device: action.payload.device,
                windowType: action.payload.code,
                data: action.payload.data,
                preserve: state.preserve,
            };
        case UI.FIRMWARE_PROGRESS:
            // firmware update first sends UI.REQUEST_BUTTON. Clear it after first progress is received
            return initialState;
        case UI.REQUEST_CONFIRMATION:
            return {
                context: MODAL.CONTEXT_DEVICE_CONFIRMATION,
                windowType: action.payload.view,
                preserve: state.preserve,
            };
        case UI.REQUEST_WORD:
            return {
                context: MODAL.CONTEXT_DEVICE,
                device: action.payload.device,
                windowType: action.payload.type,
                preserve: state.preserve,
            };
        case UI.SELECT_ACCOUNT:
            return {
                context: MODAL.CONTEXT_DEVICE_CONFIRMATION,
                windowType: UI.SELECT_ACCOUNT,
                data: action.payload,
                preserve: state.preserve,
            };
        case UI.SELECT_FEE:
            return {
                context: MODAL.CONTEXT_DEVICE_CONFIRMATION,
                windowType: UI.SELECT_FEE,
                data: action.payload,
                preserve: state.preserve,
            };

        case MODAL.OPEN_USER_CONTEXT:
            return {
                context: MODAL.CONTEXT_USER,
                payload: action.payload,
                preserve: state.preserve,
            };

        case MODAL.CLOSE:
            return initialState;

        case UI.CLOSE_UI_WINDOW:
            return state.preserve ? state : initialState;

        case MODAL.PRESERVE:
            return { ...state, preserve: true };

        default:
            return state;
    }
};

export const selectModalType = (state: ModalRootState) => {
    if ('payload' in state.modal) {
        return state.modal.payload.type;
    }

    return undefined;
};

export default modalReducer;
