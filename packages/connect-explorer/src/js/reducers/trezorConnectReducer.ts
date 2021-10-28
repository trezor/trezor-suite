import TrezorConnect, { DEVICE } from 'trezor-connect';
import * as ACTIONS from '../actions/index';
import { TrezorConnectDevice, Action } from '../types';

type ConnectState = {
    devices: TrezorConnectDevice[];
    selectedDevice?: string;
    options?: Parameters<typeof TrezorConnect['init']>[0];
};

const initialState: ConnectState = {
    devices: [],
    selectedDevice: undefined,
    options: undefined,
};

const findDeviceIndexByPath = (devices: TrezorConnectDevice[], path: string): number =>
    devices.findIndex(d => d.path === path);

const addDevice = (state: ConnectState, device: TrezorConnectDevice): ConnectState => {
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

const removeDevice = (state: ConnectState, device: TrezorConnectDevice): ConnectState => {
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

export default function connect(state: ConnectState = initialState, action: Action) {
    switch (action.type) {
        case DEVICE.CONNECT:
        case DEVICE.CONNECT_UNACQUIRED:
            return {
                ...state,
                ...addDevice(state, action.device),
            };

        case DEVICE.DISCONNECT:
            return {
                ...state,
                ...removeDevice(state, action.device),
            };

        case ACTIONS.ON_SELECT_DEVICE:
            return {
                ...state,
                selectedDevice: action.path,
            };

        case ACTIONS.ON_CHANGE_CONNECT_OPTIONS:
            return {
                ...state,
                options: action.payload,
            };
        default:
            return state;
    }
}
