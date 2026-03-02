import { UserContextPayload } from '@suite-common/suite-types';
import { THP_BUTTON_REQUESTS_NAMES } from '@suite-common/thp';
import {
    DEVICE,
    Device,
    UI_REQUEST,
    UiRequestButtonData,
    UiRequestConfirmation,
} from '@trezor/connect';
import { isArrayMember } from '@trezor/utils';

import { MODAL } from 'src/actions/suite/constants';
import type { Action, TrezorDevice } from 'src/types/suite';

export type State = ModalState & { preserve?: boolean };

export type ModalState =
    | { context: typeof MODAL.CONTEXT_NONE }
    | {
          context: typeof MODAL.CONTEXT_DEVICE;
          device: TrezorDevice | Device;
          windowType?: string;
          data?: UiRequestButtonData;
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
        case UI_REQUEST.REQUEST_PIN:
        case UI_REQUEST.INVALID_PIN:
        case UI_REQUEST.REQUEST_PASSPHRASE:
        case UI_REQUEST.REQUEST_PASSPHRASE_ON_DEVICE:
            return {
                context: MODAL.CONTEXT_DEVICE,
                device: action.payload.device,
                windowType: action.type,
                preserve: state.preserve,
            };
        case UI_REQUEST.REQUEST_BUTTON:
            // THP ButtonRequests handled separately in the `thpReducer`
            if (
                action.payload.name !== undefined &&
                isArrayMember(action.payload.name, THP_BUTTON_REQUESTS_NAMES)
            ) {
                return state;
            }

            return {
                context: MODAL.CONTEXT_DEVICE,
                device: action.payload.device,
                windowType: action.payload.code,
                data: action.payload.data,
                preserve: state.preserve,
            };
        case UI_REQUEST.FIRMWARE_PROGRESS:
            // firmware update first sends UI_REQUEST.REQUEST_BUTTON. Clear it after first progress is received
            return initialState;
        case UI_REQUEST.REQUEST_CONFIRMATION:
            return {
                context: MODAL.CONTEXT_DEVICE_CONFIRMATION,
                windowType: action.payload.view,
                preserve: state.preserve,
            };
        case UI_REQUEST.REQUEST_WORD:
            return {
                context: MODAL.CONTEXT_DEVICE,
                device: action.payload.device,
                windowType: action.payload.type,
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

        case UI_REQUEST.CLOSE_UI_WINDOW:
            return state.preserve ? state : initialState;

        case MODAL.PRESERVE:
            return { ...state, preserve: true };

        case MODAL.REMOVE_PRESERVE:
            return { ...state, preserve: false };

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
