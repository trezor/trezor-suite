import produce from 'immer';
import { DEVICE, UI } from 'trezor-connect';
import {
    ConnectReducer,
    DEVICE_CALL_RESET,
    DEVICE_CALL_START,
    DEVICE_CALL_SUCCESS,
    DEVICE_CALL_ERROR,
} from '@suite/types/onboarding/connect';
import { Action } from '@suite-types';

const initialState = {
    prevDeviceId: null,
    device: null,
    deviceCall: {
        name: null,
        isProgress: false,
        error: null,
        result: null,
    },
    uiInteraction: {
        name: undefined,
        counter: 0,
    },
};

const setPrevDeviceId = (state: ConnectReducer, device: any) => {
    // unacquired device
    if (!device.features) {
        return null;
    }
    if (!device.features.device_id) {
        return state.prevDeviceId;
    }
    if (state.prevDeviceId === null) {
        return device.features.device_id;
    }
    if (state.prevDeviceId !== device.features.device_id) {
        return state.prevDeviceId;
    }
    return device.features.device_id;
};

const connect = (state: ConnectReducer = initialState, action: Action) => {
    return produce(state, draft => {
        switch (action.type) {
            case DEVICE.CONNECT:
            case DEVICE.CONNECT_UNACQUIRED:
                draft.device = {
                    isRequestingPin: 0,
                    connected: true,
                    ...action.payload,
                };
                break;
            case DEVICE.CHANGED:
                draft.device = {
                    ...state.device,
                    connected: true,
                    ...action.payload,
                };
                break;
            case DEVICE.DISCONNECT:
                draft.device = {
                    isRequestingPin: 0,
                    connected: false,
                    ...action.payload,
                };
                draft.uiInteraction = {
                    name: undefined,
                    counter: 0,
                };
                draft.prevDeviceId = setPrevDeviceId(state, action.payload);
                break;
            case DEVICE_CALL_RESET:
                draft.deviceCall = {
                    name: null,
                    isProgress: false,
                    error: null,
                    result: null,
                };
                draft.uiInteraction = {
                    name: undefined,
                    counter: 0,
                };
                draft.prevDeviceId = null;
                break;
            case DEVICE_CALL_START:
                draft.deviceCall = {
                    ...state.deviceCall,
                    name: action.name,
                    isProgress: true,
                };
                break;
            case DEVICE_CALL_SUCCESS:
                draft.device = {
                    ...state.device,
                    isRequestingPin: 0,
                };
                draft.deviceCall = {
                    ...state.deviceCall,
                    isProgress: false,
                    error: null,
                    result: action.result,
                };
                draft.uiInteraction = {
                    name: undefined,
                    counter: 0,
                };
                break;
            case DEVICE_CALL_ERROR:
                draft.deviceCall = {
                    ...state.deviceCall,
                    name: action.name,
                    isProgress: false,
                    error: action.error,
                    result: null,
                };
                break;
            case UI.REQUEST_BUTTON:
                draft.uiInteraction = {
                    name: action.payload.code,
                    counter: state.uiInteraction.counter + 1,
                };
                break;
            case UI.REQUEST_WORD:
                draft.uiInteraction = {
                    name: action.payload.type,
                    counter: state.uiInteraction.counter + 1,
                };
                break;
            case UI.REQUEST_PIN:
                draft.device = {
                    ...state.device,
                    isRequestingPin: state.device.isRequestingPin + 1,
                };
                draft.uiInteraction = { name: undefined, counter: 0 };
                break;
            // no default
        }
    });
};

export default connect;
