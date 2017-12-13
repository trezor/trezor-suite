/* @flow */
'use strict';

import { DEVICE } from 'trezor-connect';

type State = {
    devices: Array<Object>,
    selectedDevice: ?string;
}

const initialState: State = {
    devices: [],
    selectedDevice: undefined,
};

const findDeviceIndexByPath = (devices: Array<Object>, path: string): number => {
    let index: number = -1;
    for (let [i, dev] of devices.entries() ) {
        if (dev.path === path) {
            index = i;
            break;
        }
    }
    return index;
}

const addDevice = (state: State, device: Object): State => {
    let index: number = findDeviceIndexByPath(state.devices, device.path);
    if (index > -1) {
        state.devices[index] = device;
    } else {
        state.devices.push(device);
    }
    return state;
}

const removeDevice = (state: State, device: Object): State => {
    if (state.selectedDevice === device.path) {
        state.selectedDevice = undefined;
    }
    let index: number = findDeviceIndexByPath(state.devices, device.path);
    if (index > -1) {
        
        state.devices.splice(index, 1);
    }
    return state;
}

const onDeviceStateChange = (device: Object): void => {

}

export default function connect(state: State = initialState, action: any): any {

    switch (action.type) {

        case DEVICE.CONNECT :
        case DEVICE.CONNECT_UNACQUIRED :
            return {
                ...state,
                ...addDevice(state, action.device)
            };
        break;

        case DEVICE.DISCONNECT :
        case DEVICE.DISCONNECT_UNACQUIRED :
            return {
                ...state,
                ...removeDevice(state, action.device)
            };
        break;

        case 'select_device' :
            return {
                ...state,
                selectedDevice: action.path,
            };
        break;

        default:
            return state;
    }

}