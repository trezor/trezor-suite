import { DEVICE } from 'trezor-connect';
import * as Connect from '@suite/types/onboarding/connect';
import { Action } from '@suite/types/onboarding/actions';

const initialState: Connect.ConnectReducer = {
    prevDeviceId: null,
    device: null,
    deviceCall: {
        name: null,
        isProgress: false,
        error: null,
        result: null,
    },
    deviceInteraction: {
        name: null,
        counter: 0,
    },
    uiInteraction: {
        name: null,
        counter: 0,
    },
};

const setPrevDeviceId = (state: Connect.ConnectReducer, device: Connect.Device) => {
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

const connect = (
    state: Connect.ConnectReducer = initialState,
    action: Connect.ActionTypes,
): Connect.ConnectReducer => {
    switch (action.type) {
        case DEVICE.CONNECT:
        case DEVICE.CONNECT_UNACQUIRED:
            return {
                ...state,
                device: {
                    isRequestingPin: 0,
                    connected: true,
                    // features: {}, // ??
                    ...action.payload,
                },
            };
        case DEVICE.CHANGED:
            return {
                ...state,
                device: {
                    ...state.device,
                    connected: true,
                    // features: {}, // ?
                    ...action.payload,
                },
            };
        case DEVICE.DISCONNECT:
            return {
                ...state,
                device: {
                    isRequestingPin: 0,
                    connected: false,
                    ...action.payload,
                },
                uiInteraction: {
                    name: null,
                    counter: 0,
                },
                prevDeviceId: setPrevDeviceId(state, action.payload),
            };
        case Connect.DEVICE_CALL_RESET: {
            return {
                ...state,
                deviceCall: {
                    name: null,
                    isProgress: false,
                    error: null,
                    result: null,
                },
                deviceInteraction: {
                    name: null,
                    counter: 0,
                },
                uiInteraction: {
                    name: null,
                    counter: 0,
                },
                prevDeviceId: null,
            };
        }
        case Connect.DEVICE_CALL_START:
            return {
                ...state,
                deviceCall: {
                    ...state.deviceCall,
                    name: action.name,
                    isProgress: true,
                },
            };
        case Connect.DEVICE_CALL_SUCCESS:
            return {
                ...state,
                device: {
                    ...state.device,
                    isRequestingPin: 0,
                },
                deviceCall: {
                    ...state.deviceCall,
                    isProgress: false,
                    error: null,
                    result: action.result,
                },
                deviceInteraction: {
                    name: null,
                    counter: 0,
                },
                uiInteraction: {
                    name: null,
                    counter: 0,
                },
            };
        case Connect.DEVICE_CALL_ERROR:
            return {
                ...state,
                deviceCall: {
                    ...state.deviceCall,
                    name: action.name,
                    isProgress: false,
                    error: action.error,
                    result: null,
                },
            };
        case 'button':
            return {
                ...state,
                deviceInteraction: {
                    name: action.payload.code,
                    counter: state.deviceInteraction.counter + 1,
                },
            };
        case 'ui-button':
            return {
                ...state,
                uiInteraction: {
                    name: action.payload.code,
                    counter: state.uiInteraction.counter + 1,
                },
            };
        case 'ui-request_pin':
            return {
                ...state,
                device: {
                    ...state.device,
                    isRequestingPin: state.device.isRequestingPin + 1,
                },
                uiInteraction: { name: null, counter: 0 },
                deviceInteraction: { name: null, counter: 0 },
            };
        default:
            return state;
    }
};

export default connect;
