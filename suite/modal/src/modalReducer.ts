import { AnyAction } from '@reduxjs/toolkit';

import { TrezorDevice, UserContextPayload } from '@suite-common/suite-types';
import { THP_BUTTON_REQUESTS_NAMES } from '@suite-common/thp';
import {
    DEVICE,
    Device,
    UI_REQUEST,
    UiRequestButtonData,
    UiRequestConfirmation,
    UiRequestSelectAccount,
    UiRequestSelectFee,
} from '@trezor/connect';
import { isArrayMember } from '@trezor/utils';

import {
    MODAL_CLOSE,
    MODAL_CONTEXT_DEVICE,
    MODAL_CONTEXT_DEVICE_CONFIRMATION,
    MODAL_CONTEXT_NONE,
    MODAL_CONTEXT_USER,
    MODAL_OPEN_USER_CONTEXT,
    MODAL_PRESERVE,
    MODAL_REMOVE_PRESERVE,
} from './constants';

export type State = ModalState & { preserve?: boolean };

export type ModalState =
    | { context: typeof MODAL_CONTEXT_NONE }
    | {
          context: typeof MODAL_CONTEXT_DEVICE;
          device: TrezorDevice | Device;
          windowType?: string;
          data?: UiRequestButtonData;
      }
    | {
          context: typeof MODAL_CONTEXT_DEVICE_CONFIRMATION;
          windowType: typeof UI_REQUEST.SELECT_ACCOUNT;
          data?: UiRequestSelectAccount['payload'];
      }
    | {
          context: typeof MODAL_CONTEXT_DEVICE_CONFIRMATION;
          windowType: typeof UI_REQUEST.SELECT_FEE;
          data?: UiRequestSelectFee['payload'];
      }
    | {
          context: typeof MODAL_CONTEXT_DEVICE_CONFIRMATION;
          windowType: UiRequestConfirmation['payload']['view'];
          data?: undefined;
      }
    | {
          context: typeof MODAL_CONTEXT_USER;
          payload: UserContextPayload;
      };

type ModalRootState = {
    modal: ModalState;
};

const initialState: State = {
    context: MODAL_CONTEXT_NONE,
};

const modalReducer = (state: State = initialState, action: AnyAction): State => {
    switch (action.type) {
        // device with context assigned to modal was disconnected
        case DEVICE.DISCONNECT:
            if (
                (state.context === MODAL_CONTEXT_DEVICE &&
                    action.payload.path === state.device.path) ||
                state.context === MODAL_CONTEXT_USER
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
                context: MODAL_CONTEXT_DEVICE,
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
                context: MODAL_CONTEXT_DEVICE,
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
                context: MODAL_CONTEXT_DEVICE_CONFIRMATION,
                windowType: action.payload.view,
                preserve: state.preserve,
            };
        case UI_REQUEST.REQUEST_WORD:
            return {
                context: MODAL_CONTEXT_DEVICE,
                device: action.payload.device,
                windowType: action.payload.type,
                preserve: state.preserve,
            };
        case UI_REQUEST.SELECT_ACCOUNT:
            return {
                context: MODAL_CONTEXT_DEVICE_CONFIRMATION,
                windowType: UI_REQUEST.SELECT_ACCOUNT,
                data: action.payload,
                preserve: state.preserve,
            };
        case UI_REQUEST.SELECT_FEE:
            return {
                context: MODAL_CONTEXT_DEVICE_CONFIRMATION,
                windowType: UI_REQUEST.SELECT_FEE,
                data: action.payload,
                preserve: state.preserve,
            };

        case MODAL_OPEN_USER_CONTEXT:
            return {
                context: MODAL_CONTEXT_USER,
                payload: action.payload,
                preserve: state.preserve,
            };

        case MODAL_CLOSE:
            return initialState;

        case UI_REQUEST.CLOSE_UI_WINDOW:
            return state.preserve ? state : initialState;

        case MODAL_PRESERVE:
            return { ...state, preserve: true };

        case MODAL_REMOVE_PRESERVE:
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

export const selectRecoveryWordRequestInputType = (state: ModalRootState) => {
    if (state.modal.context !== MODAL_CONTEXT_DEVICE) {
        return null;
    }

    switch (state.modal.windowType) {
        case 'WordRequestType_Matrix6':
            return 6 as const;
        case 'WordRequestType_Matrix9':
            return 9 as const;
        case 'WordRequestType_Plain':
            return 'plain' as const;
        default:
            return null;
    }
};

export { modalReducer };
