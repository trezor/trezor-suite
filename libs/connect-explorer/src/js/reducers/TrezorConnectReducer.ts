/* eslint-disable no-restricted-syntax */

import { DEVICE } from 'trezor-connect';
import * as ACTIONS from '../actions/index';

interface State {
    devices: any[]; // todo: better
    selectedDevice?: string;
}

const initialState: State = {
    devices: [],
    selectedDevice: undefined,
};

const findDeviceIndexByPath = (devices: State['devices'], path: string): number => {
    let index = -1;
    for (const [i, dev] of devices.entries()) {
        if (dev.path === path) {
            index = i;
            break;
        }
    }
    return index;
};

const addDevice = (state: State, device: Record<string, any>) => {
    const index: number = findDeviceIndexByPath(state.devices, device.path);
    if (index > -1) {
        state.devices[index] = device;
    } else {
        state.devices.push(device);
    }

    if (state.devices.length === 1) {
        state.selectedDevice = state.devices[0].path;
    }
    return state;
};

const removeDevice = (state: State, device: Record<string, any>) => {
    if (state.selectedDevice === device.path) {
        state.selectedDevice = undefined;
    }
    const index: number = findDeviceIndexByPath(state.devices, device.path);
    if (index > -1) {
        state.devices.splice(index, 1);
    }
    if (state.devices.length === 1) {
        state.selectedDevice = state.devices[0].path;
    }
    return state;
};

// const onDeviceStateChange = (device: Record<string, any>): void => {};

export default function connect(state: State = initialState, action) {
    switch (action.type) {
        case DEVICE.CONNECT:
        case DEVICE.CONNECT_UNACQUIRED:
            return {
                ...state,
                ...addDevice(state, action.device),
            };
        case DEVICE.DISCONNECT:
        // @ts-ignore connect eslint-disable-next-line no-fallthrough
        case DEVICE.DISCONNECT_UNACQUIRED:
            return {
                ...state,
                ...removeDevice(state, action.device),
            };
        case ACTIONS.ON_SELECT_DEVICE:
            return {
                ...state,
                selectedDevice: action.path,
            };
        default:
            return state;
    }
}
