/* @flow */
'use strict';

import { TRANSPORT, DEVICE } from 'trezor-connect';
import * as CONNECT from '../actions/constants/TrezorConnect';

export type TrezorDevice = {
    remember: boolean;
    connected: boolean;
    path: string;
    +label: string;
    +checksum: string;
    +instance?: number;
    instanceLabel: string;
    features?: Object;
    unacquired?: boolean;
    acquiring: boolean;
    isUsedElsewhere?: boolean;
    featuresNeedsReload?: boolean;
    ts: number;
}

export type SelectedDevice = {
    id: string; // could be device path if unacquired or features.device_id
    instance: ?number;
}

type State = {
    devices: Array<TrezorDevice>;
    selectedDevice: ?SelectedDevice;
    discoveryComplete: boolean;
    error: any;
    transport: ?string;
    browserState: any;
}


const initialState: State = {
    devices: [],
    selectedDevice: null,
    discoveryComplete: false,
    error: null,
    transport: null,
    browserState: {}
};

export const findSelectedDevice = (state: State): ?TrezorDevice => {
    const selected: ?SelectedDevice = state.selectedDevice;
    if (!selected) return null;

    return state.devices.find(d => {
        if (d.unacquired && d.path === selected.id) {
            return true;
        } else if (d.features && d.features.device_id === selected.id && d.instance === selected.instance){
            return true;
        }
        return false;
    });
}

export const isSavedDevice = (state: State, device: any): ?Array<TrezorDevice> => {
    const selected: ?SelectedDevice = state.selectedDevice;
    if (!selected) return null;

    if (!device || !device.features) return null;

    return state.devices.filter(d => {
        if (d.features && d.features.device_id === device.features.device_id){
            return d;
        }
        return null;
    });
}

const mergeDevices = (current: TrezorDevice, upcoming: Object): TrezorDevice => {
    const dev: TrezorDevice = {
        // ...current,
        ...upcoming,
        // make sure that instance specific variables will not be overridden
        connected: typeof upcoming.connected === 'boolean' ? upcoming.connected : current.connected,
        remember: typeof upcoming.remember === 'boolean' ? upcoming.remember : current.remember,
        instance: current.instance,
        instanceLabel: current.instanceLabel,
        checksum: current.checksum,
        acquiring: typeof upcoming.acquiring === 'boolean' ? upcoming.acquiring : current.acquiring,
        ts: new Date().getTime(),
    }

    if (upcoming.unacquired && current.checksum) {
        dev.instanceLabel = current.instanceLabel;
        dev.features = current.features;
        dev.label = current.label;
        dev.unacquired = false;
    } else if (!upcoming.unacquired && current.unacquired) {
        dev.instanceLabel = upcoming.label;
        if (typeof dev.instance === 'number') {
            dev.instanceLabel = `${upcoming.label} #${dev.instance}`;
        }
    }

    return dev;
}

const addDevice = (state: State, device: Object): State => {

    const newState: State = { ...state };

    let affectedDevices: Array<TrezorDevice> = [];
    let otherDevices: Array<TrezorDevice> = [];
    if (device.unacquired) {
        // check if connected device is unacquired, but it was already merged with saved device(s) after DEVICE.CHANGE action
        affectedDevices = newState.devices.filter(d => d.path === device.path);
        const diff = newState.devices.filter(d => affectedDevices.indexOf(d) === -1);

        // if so, ignore this action
        if (affectedDevices.length > 0) {
            return state;
        }
    } else {
        affectedDevices = newState.devices.filter(d => d.features && d.features.device_id === device.features.device_id);
        otherDevices = newState.devices.filter(d => d.features && d.features.device_id !== device.features.device_id);
    }

    if (affectedDevices.length > 0 ) {
        // replace existing values
        const changedDevices: Array<TrezorDevice> = affectedDevices.map(d => mergeDevices(d, { ...device, connected: true} ));
        newState.devices = otherDevices.concat(changedDevices);

    } else {

        const newDevice: TrezorDevice = {
            ...device,
            acquiring: false,
            remember: false,
            connected: true,
            path: device.path,
            label: device.label,
            checksum: null,
            // instance: 0,
            instanceLabel: device.label,
            ts: 0,
        }
        newState.devices.push(newDevice);

        // const clone = { ...newDevice, instance: 1, instanceLabel: device.label + '#1' };
        // newState.devices.push(clone);
    }

    return newState;
}

const setDeviceState = (state: State, action: any): State => {
    const newState: State = { ...state };

    //const affectedDevice: ?TrezorDevice = state.devices.find(d => d.path === action.device.path && d.instance === action.device.instance);
    const index: number = state.devices.findIndex(d => d.path === action.device.path && d.instance === action.device.instance);
    if (index > -1) {
        const changedDevice: TrezorDevice = { 
            ...newState.devices[index],
            checksum: action.checksum
        };
        newState.devices[index] = changedDevice;
        //newState.selectedDevice = changedDevice;
    }

    return newState;
}

const changeDevice = (state: State, device: Object): State => {

    const newState: State = { ...state };

    let affectedDevices: Array<TrezorDevice> = [];
    let otherDevices: Array<TrezorDevice> = [];
    if (device.features) {
        affectedDevices = state.devices.filter(d => (d.features && d.features.device_id === device.features.device_id) || (d.path.length > 0  && d.path === device.path) );
        otherDevices = state.devices.filter(d => affectedDevices.indexOf(d) === -1);
    } else {
        affectedDevices = state.devices.filter(d => d.path === device.path);
        otherDevices = state.devices.filter(d => d.path !== device.path);
    }

    if (affectedDevices.length > 0) {

        const isAffectedUnacquired: number = affectedDevices.findIndex(d => d.unacquired);
        if (isAffectedUnacquired >= 0 && affectedDevices.length > 1){
            affectedDevices.splice(isAffectedUnacquired, 1);
        } 
        
        // else if (isAffectedUnacquired >= 0 && !device.unacquired && affectedDevices.length > 1) {
        //     affectedDevices.splice(isAffectedUnacquired, 1);
        //     console.warn("CLEARRRR", isAffectedUnacquired);
        // }
        console.warn("AFFEEE", isAffectedUnacquired, affectedDevices, otherDevices)


        // acquiring selected device. remove unnecessary (not acquired) device from list
        // after this action selectedDevice needs to be updated (in TrezorConnectService)
        if (state.selectedDevice && device.path === state.selectedDevice.id && affectedDevices.length > 1) {
            console.warn("clear dupli", affectedDevices, otherDevices)
            // affectedDevices = affectedDevices.filter(d => d.path !== state.selectedDevice.id && d.features);
        }

        

        // replace existing values
        const changedDevices: Array<TrezorDevice> = affectedDevices.map(d => mergeDevices(d, device));
        newState.devices = otherDevices.concat(changedDevices);
    }

    return newState;
}


const disconnectDevice = (state: State, device: Object): State => {

    const newState: State = { ...state };
    const affectedDevices: Array<TrezorDevice> = state.devices.filter(d => d.path === device.path);
    const otherDevices: Array<TrezorDevice> = state.devices.filter(d => affectedDevices.indexOf(d) === -1);

    if (affectedDevices.length > 0) {
        const acquiredDevices = affectedDevices.filter(d => !d.unacquired && d.checksum);
        newState.devices = otherDevices.concat( acquiredDevices.map(d => {
            d.connected = false;
            d.isUsedElsewhere = false;
            d.featuresNeedsReload = false;
            d.acquiring = false;
            //if (d.remember)
            d.path = '';
            return d;
        }));
    }

    // selected device was removed and forgotten
    // clear this field
    const selected = findSelectedDevice(newState);
    if (!selected) {
        newState.selectedDevice = null;
    }

    return newState;
}

const forgetDevice = (state: State, action: any): State => {
    const newState: State = { ...state };

    if (action.type === CONNECT.FORGET_SINGLE) {
        // remove only one instance (called from Aside button)
        newState.devices.splice(newState.devices.indexOf(action.device), 1);
    } else {
        // remove all instances after disconnect (remember request declined)
        //newState.devices = state.devices.filter(d => d.path !== action.device.path);
        newState.devices = state.devices.filter(d => (d.features && d.features.device_id !== action.device.features.device_id) || (!d.features && d.path !== action.device.path));
    }

    return newState;
}

const devicesFromLocalStorage = (devices: Array<any>): Array<TrezorDevice> => {
    return devices.map(d => {
        return {
            ...d,
            connected: false,
            path: '',
            acquiring: false,
            featuresNeedsReload: false,
            isUsedElsewhere: false
        }
    });
}

const duplicate = (state: State, device: any): State => {
    const newState: State = { ...state };
    const affectedDevices: Array<TrezorDevice> = state.devices.filter(d => d.path === device.path);

    // if (affectedDevices.length > 0) {
        const newDevice: TrezorDevice = {
            ...device,
            checksum: null,
            remember: device.remember,
            connected: device.connected,
            path: device.path,
            label: device.label,
            instance: new Date().getTime(),
            instanceLabel: device.instanceLabel,
            ts: 0,
        }
        newState.devices.push(newDevice);
        newState.selectedDevice = {
            id: newDevice.features.device_id,
            instance: newDevice.instance
        }
    //}

    return newState;
}



export default function connect(state: State = initialState, action: any): any {

    switch (action.type) {

        case 'iframe_handshake' : 
            return {
                ...state,
                browserState: action.payload.browserState
            }
        

        case CONNECT.DUPLICATE :
            return duplicate(state, action.device);


        case CONNECT.SELECT_DEVICE : 
            return {
                ...state,
                selectedDevice: action.payload
            }

        case CONNECT.INITIALIZATION_ERROR :
            return {
                ...state,
                error: action.error
            };

        case TRANSPORT.START :
            return {
                ...state,
                transport: action.payload
            }

        case TRANSPORT.ERROR :
            return {
                ...state,
                // error: action.payload, // message is wrapped in "device" field. It's dispatched from TrezorConnect.on(DEVICE_EVENT...) in TrezorConnectService
                error: "Transport is missing",
                transport: null,
            };

        case CONNECT.DEVICE_FROM_STORAGE :
            return {
                ...state,
                devices: devicesFromLocalStorage(action.payload),
            }

        case CONNECT.AUTH_DEVICE :
            return setDeviceState(state, action);

        case DEVICE.CONNECT :
        case DEVICE.CONNECT_UNACQUIRED :
            return addDevice(state, action.device);

        case CONNECT.REMEMBER :
            return changeDevice(state, { ...action.device, path: '', remember: true } );

        case CONNECT.FORGET :
        case CONNECT.FORGET_SINGLE :
            return forgetDevice(state, action);

        case CONNECT.START_ACQUIRING :
        case CONNECT.STOP_ACQUIRING :
            return changeDevice(state, { ...action.device, acquiring: action.type === CONNECT.START_ACQUIRING } );

        case DEVICE.DISCONNECT :
        case DEVICE.DISCONNECT_UNACQUIRED :
            return disconnectDevice(state, action.device);

        case DEVICE.CHANGED :
            return changeDevice(state, { ...action.device, connected: true });

        default:
            return state;
    }

}