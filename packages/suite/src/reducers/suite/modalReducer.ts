import { UI, DEVICE } from 'trezor-connect';
import * as MODAL from '@suite-actions/constants/modalConstants';
import * as CONNECT from '@suite-actions/trezorConnectActions';

const initialState = {
    context: MODAL.CONTEXT_NONE,
};

export default function modal(state = initialState, action) {
    switch (action.type) {
        case CONNECT.FORGET_REQUEST:
        case CONNECT.TRY_TO_DUPLICATE:
        case CONNECT.REQUEST_WALLET_TYPE:
            return {
                context: MODAL.CONTEXT_DEVICE,
                device: action.device,
                windowType: action.type,
            };

        case CONNECT.REMEMBER_REQUEST:
            return {
                context: MODAL.CONTEXT_DEVICE,
                device: action.device,
                instances: action.instances,
                windowType: action.type,
            };

        // device connected
        // close modal if modal context is not 'device'
        case DEVICE.CONNECT:
        case DEVICE.CONNECT_UNACQUIRED:
            if (state.context !== MODAL.CONTEXT_DEVICE) {
                return initialState;
            }
            return state;

        // device with context assigned to modal was disconnected
        // close modal
        case DEVICE.DISCONNECT:
            if (
                state.context === MODAL.CONTEXT_DEVICE &&
                action.device.path === state.device.path
            ) {
                return initialState;
            }
            return state;

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

        case UI.CLOSE_UI_WINDOW:
        case MODAL.CLOSE:
        case CONNECT.FORGET:
        case CONNECT.FORGET_SINGLE:
        case CONNECT.REMEMBER:
            return initialState;

        case UI.REQUEST_CONFIRMATION:
            return {
                context: MODAL.CONTEXT_CONFIRMATION,
                windowType: action.payload.view,
            };

        default:
            return state;
    }
}
