import { type UnknownAction } from '@reduxjs/toolkit';

import { deviceActions } from '@suite-common/device';
import { type TrezorDevice, type UserContextPayload } from '@suite-common/suite-types';
import { THP_BUTTON_REQUESTS_NAMES } from '@suite-common/thp';
import {
    type Device,
    UI_EVENTS,
    UI_REQUESTS,
    type UiRequestButtonData,
    type UiRequestConfirmation,
    type UiRequestSelectAccount,
    type UiRequestSelectFee,
    isUiEventOfType,
    isUiRequestOfType,
} from '@trezor/connect';
import { isArrayMember } from '@trezor/utils';

import {
    MODAL_CONTEXT_DEVICE,
    MODAL_CONTEXT_DEVICE_CONFIRMATION,
    MODAL_CONTEXT_NONE,
    MODAL_CONTEXT_USER,
} from './constants';
import {
    closeModal,
    openModal,
    preserveModal,
    preserveModalOnTxTimeout,
    removePreserveModal,
} from './modalActions';

export type State = ModalState & { preserve?: boolean; preserveOnTxTimeout?: boolean };

export type ModalState =
    | { context: typeof MODAL_CONTEXT_NONE }
    | {
          context: typeof MODAL_CONTEXT_DEVICE;
          device: TrezorDevice | Device;
          windowType?: string;
          data?: UiRequestButtonData;
          requestId?: string;
      }
    | {
          context: typeof MODAL_CONTEXT_DEVICE_CONFIRMATION;
          windowType: typeof UI_REQUESTS.REQUEST_ACCOUNT;
          data?: UiRequestSelectAccount['payload'];
          requestId?: string;
      }
    | {
          context: typeof MODAL_CONTEXT_DEVICE_CONFIRMATION;
          windowType: typeof UI_REQUESTS.REQUEST_FEE;
          data?: UiRequestSelectFee['payload'];
          requestId?: string;
      }
    | {
          context: typeof MODAL_CONTEXT_DEVICE_CONFIRMATION;
          windowType: UiRequestConfirmation['payload']['view'];
          data?: undefined;
          requestId?: string;
      }
    | {
          context: typeof MODAL_CONTEXT_USER;
          payload: UserContextPayload;
      };

export type ModalRootState = {
    modal: ModalState;
};

const initialState: State = {
    context: MODAL_CONTEXT_NONE,
};

export const modalReducer = (state: State = initialState, action: UnknownAction): State => {
    const requestId = typeof action.requestId === 'string' ? action.requestId : undefined;

    // device with context assigned to modal was disconnected
    if (deviceActions.deviceDisconnect.match(action)) {
        if (
            (state.context === MODAL_CONTEXT_DEVICE && action.payload.path === state.device.path) ||
            state.context === MODAL_CONTEXT_USER
        ) {
            return initialState;
        }

        return state;
    }

    // assign device to modal context
    if (
        isUiRequestOfType(action, UI_REQUESTS.REQUEST_PIN, UI_REQUESTS.REQUEST_PASSPHRASE) ||
        isUiEventOfType(action, UI_EVENTS.PIN_INVALID, UI_EVENTS.PASSPHRASE_ON_DEVICE)
    ) {
        return {
            context: MODAL_CONTEXT_DEVICE,
            device: action.payload.device,
            windowType: action.type,
            preserve: state.preserve,
            requestId,
        };
    }

    if (isUiEventOfType(action, UI_EVENTS.BUTTON_REQUEST)) {
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
    }

    if (isUiEventOfType(action, UI_EVENTS.FIRMWARE_PROGRESS)) {
        // firmware update first sends UI_EVENTS.BUTTON_REQUEST. Clear it after first progress is received
        return initialState;
    }

    if (isUiRequestOfType(action, UI_REQUESTS.REQUEST_CONFIRMATION)) {
        return {
            context: MODAL_CONTEXT_DEVICE_CONFIRMATION,
            windowType: action.payload.view,
            preserve: state.preserve,
            requestId,
        };
    }

    if (isUiRequestOfType(action, UI_REQUESTS.REQUEST_WORD)) {
        return {
            context: MODAL_CONTEXT_DEVICE,
            device: action.payload.device,
            windowType: action.payload.type,
            preserve: state.preserve,
            requestId,
        };
    }

    if (isUiRequestOfType(action, UI_REQUESTS.REQUEST_ACCOUNT)) {
        return {
            context: MODAL_CONTEXT_DEVICE_CONFIRMATION,
            windowType: UI_REQUESTS.REQUEST_ACCOUNT,
            data: action.payload,
            preserve: state.preserve,
        };
    }

    if (isUiRequestOfType(action, UI_REQUESTS.REQUEST_FEE)) {
        return {
            context: MODAL_CONTEXT_DEVICE_CONFIRMATION,
            windowType: UI_REQUESTS.REQUEST_FEE,
            data: action.payload,
            preserve: state.preserve,
        };
    }

    if (openModal.match(action)) {
        return {
            context: MODAL_CONTEXT_USER,
            payload: action.payload,
            preserve: state.preserve,
        };
    }

    if (closeModal.match(action)) {
        return initialState;
    }

    if (isUiEventOfType(action, UI_EVENTS.CLOSE_UI_WINDOW)) {
        if (
            state.context === MODAL_CONTEXT_DEVICE ||
            state.context === MODAL_CONTEXT_DEVICE_CONFIRMATION
        ) {
            // preserveOnTxTimeout: timer cancelled signing — keep modal open to show expired state.
            if (state.preserveOnTxTimeout) {
                return { ...state, preserveOnTxTimeout: false };
            }

            // preserve: signing flow is about to replace this device modal with a user-context
            // modal (openDeferredModal). On desktop, CLOSE_UI_WINDOW arrives via IPC in a
            // separate event loop turn, so closing here causes a visible flash. Keep the modal
            // open but clear preserve so the next action can take over cleanly.
            if (state.preserve) {
                return { ...state, preserve: false };
            }

            return initialState;
        }

        return state.preserve ? state : initialState;
    }

    if (preserveModal.match(action)) {
        return { ...state, preserve: true };
    }

    if (preserveModalOnTxTimeout.match(action)) {
        return { ...state, preserveOnTxTimeout: true };
    }

    if (removePreserveModal.match(action)) {
        return { ...state, preserve: false };
    }

    return state;
};

export const selectHasActiveModal = (state: ModalRootState) =>
    state.modal.context !== MODAL_CONTEXT_NONE;

export const selectModal = (state: ModalRootState) => state.modal;
export const selectModalContext = (state: ModalRootState) => state.modal.context;
export const selectIsDeviceInteractionModalActive = (state: ModalRootState) =>
    state.modal.context === MODAL_CONTEXT_DEVICE ||
    state.modal.context === MODAL_CONTEXT_DEVICE_CONFIRMATION;

export const selectModalRequestId = (state: ModalRootState) =>
    state.modal.context === MODAL_CONTEXT_DEVICE ? state.modal.requestId : undefined;

export const selectModalType = (state: ModalRootState) => {
    if ('payload' in state.modal) {
        return state.modal.payload.type;
    }

    return undefined;
};

type ContextModal<Context extends ModalState['context']> = Extract<
    ModalState,
    { context: Context }
>;

type UserContextModal = ContextModal<typeof MODAL_CONTEXT_USER>['payload'];

export type UserContextModalType<Type extends UserContextModal['type']> = Extract<
    UserContextModal,
    { type: Type }
>;

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
