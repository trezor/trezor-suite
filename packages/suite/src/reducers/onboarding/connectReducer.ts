import * as Connect from '@suite/types/onboarding/connect';
import { Action } from '@suite/types/onboarding/actions';

const initialState: Connect.ConnectReducer = {
    prevDeviceId: null,
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
        case Connect.DISCONNECT:
            return {
                ...state,
                device: {
                    connected: false,
                    ...action.device,
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
        case Connect.DEVICE_INTERACTION_EVENT:
            return {
                ...state,
                uiInteraction: { name: null, counter: 0 },
                deviceInteraction: {
                    name: action.name,
                    counter: state.deviceInteraction.counter + 1,
                },
            };
        case Connect.UI_INTERACTION_EVENT:
            return {
                ...state,
                uiInteraction: { name: action.name, counter: state.uiInteraction.counter + 1 },
                deviceInteraction: { name: null, counter: 0 },
            };
        default:
            return state;
    }
};

export default connect;
