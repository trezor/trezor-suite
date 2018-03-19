/* @flow */
'use strict';

import { DEVICE } from 'trezor-connect';
import * as ACTIONS from '../actions/index';

type ConnectState = {
    devices: Array<Object>,
    selectedDevice: ?string;
}

const initialState: ConnectState = {
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

const addDevice = (state: ConnectState, device: Object): ConnectState => {
    let index: number = findDeviceIndexByPath(state.devices, device.path);
    if (index > -1) {
        state.devices[index] = device;
    } else {
        state.devices.push(device);
    }
    
    if (state.devices.length === 1) {
        state.selectedDevice = state.devices[0].path;
    }
    return state;
}

const removeDevice = (state: ConnectState, device: Object): ConnectState => {
    if (state.selectedDevice === device.path) {
        state.selectedDevice = undefined;
    }
    let index: number = findDeviceIndexByPath(state.devices, device.path);
    if (index > -1) {
        state.devices.splice(index, 1);
    }
    if (state.devices.length === 1) {
        state.selectedDevice = state.devices[0].path;
    }
    return state;
}

const onDeviceStateChange = (device: Object): void => {

}

export default function connect(state: ConnectState = initialState, action: any): any {

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

        case ACTIONS.ON_SELECT_DEVICE :
            return {
                ...state,
                selectedDevice: action.path,
            };
        break;

        default:
            return state;
    }

}