/* @flow */
'use strict';

import { TRANSPORT, DEVICE } from 'trezor-connect';
import * as CONNECT from '../actions/constants/TrezorConnect';

import type { Action, TrezorDevice } from '../flowtype';
import type { Device } from 'trezor-connect';

export type SelectedDevice = {
    id: string; // could be device path if unacquired or features.device_id
    instance: ?number;
}

export type State = {
    devices: Array<TrezorDevice>;
    selectedDevice: ?SelectedDevice;
    discoveryComplete: boolean;
    error: ?string;
    transport: ?{
        type: string;
        version: string;
    };
    // browserState: {
    //     name: string;
    //     osname: string;
    //     supported: boolean;
    //     outdated: boolean;
    //     mobile: boolean;
    // } | {};
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

export const findDevice = (devices: Array<TrezorDevice>, deviceId: string, deviceState: string, instance: ?number): ?TrezorDevice => {
    return devices.find(d => {
        // TODO: && (instance && d.instance === instance)
        if (d.features && d.features.device_id === deviceId && d.state === deviceState) {
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

export const getNewInstance = (devices: Array<TrezorDevice>, device: Device | TrezorDevice): number => {

    const affectedDevices: Array<TrezorDevice> = devices.filter(d => d.features && device.features && d.features.device_id === device.features.device_id)
    .sort((a, b) => {
        if (!a.instance) {
            return -1;
        } else {
            return !b.instance || a.instance > b.instance ? 1 : -1;
        }
    });

    const instance: number = affectedDevices.reduce((inst, dev) => {
        return dev.instance ? dev.instance + 1 : inst + 1;
    }, 0);

    return instance;
}

const mergeDevices = (current: TrezorDevice, upcoming: Object): TrezorDevice => {

    // do not merge if passphrase protection was changed
    // if (upcoming.features && current.features) {
    //     if (upcoming.features.passphrase_protection !== current.features.passphrase_protection) {
    //         // device settings has been changed, reset state
    //         // dev.state = null;
    //     }
    // }

    let instanceLabel = current.instanceLabel;
    if (upcoming.label !== current.label) {
        instanceLabel = upcoming.label
        if (typeof current.instance === 'number') {
            instanceLabel += ` (${current.instanceName || current.instance})`;
        }
    }

    const dev: TrezorDevice = {
        // ...current,
        ...upcoming,
        // make sure that instance specific variables will not be overridden
        connected: typeof upcoming.connected === 'boolean' ? upcoming.connected : current.connected,
        available: typeof upcoming.available === 'boolean' ? upcoming.available : current.available,
        remember: typeof upcoming.remember === 'boolean' ? upcoming.remember : current.remember,
        instance: current.instance,
        instanceLabel,
        state: current.state,
        acquiring: typeof upcoming.acquiring === 'boolean' ? upcoming.acquiring : current.acquiring,
        ts: typeof upcoming.ts === 'number' ? upcoming.ts : current.ts,
    }
    // corner-case: trying to merge unacquired device with acquired
    // make sure that sensitive fields will not be changed and device will remain acquired
    if (upcoming.unacquired && current.state) {
        dev.unacquired = false;
        dev.features = current.features;
        dev.label = current.label;
    }

    return dev;
}

const addDevice = (state: State, device: Device): State => {

    const newState: State = { ...state };

    let affectedDevices: Array<TrezorDevice> = [];
    let otherDevices: Array<TrezorDevice> = [];
    if (device.unacquired) {
        // check if connected device is unacquired, but it was already merged with saved device(s) after DEVICE.CHANGE action
        affectedDevices = newState.devices.filter(d => d.path === device.path);
        const diff: Array<TrezorDevice> = newState.devices.filter(d => affectedDevices.indexOf(d) === -1);

        // if so, ignore this action
        if (affectedDevices.length > 0) {
            return state;
        }
    } else {
        affectedDevices = newState.devices.filter(d => d.features && d.features.device_id === device.features.device_id);
        otherDevices = newState.devices.filter(d => d.features && d.features.device_id !== device.features.device_id);
    }

    if (affectedDevices.length > 0 ) {
        // check if freshly added device has different "passphrase_protection" settings
        let cloneInstance: number = 1;
        let hasDifferentPassphraseSettings: boolean = false;
        let hasInstancesWithPassphraseSettings: boolean = false;
        const changedDevices: Array<TrezorDevice> = affectedDevices.map(d => {
            if (d.features && d.features.passphrase_protection === device.features.passphrase_protection) {
                cloneInstance = 0;
                hasInstancesWithPassphraseSettings = true;
                return mergeDevices(d, { ...device, connected: true, available: true } );
            } else {
                hasDifferentPassphraseSettings = true;
                if (d.instance && cloneInstance > 0) {
                    cloneInstance = d.instance + 1;
                }
                return mergeDevices(d, { ...d, connected: true, available: false } );
                // return d;
            }
        });

        // edge case: freshly connected device has different "passphrase_protection" than saved instances
        // need to automatically create another instance with default instance name
        if (hasDifferentPassphraseSettings && !hasInstancesWithPassphraseSettings) {
            // TODO: instance should be calculated form affectedDevice
            // const instance = cloneInstance; //new Date().getTime();
            const instance = getNewInstance(affectedDevices, device);

            const newDevice: TrezorDevice = {
                ...device,
                acquiring: false,
                remember: false,
                connected: true,
                available: true,
                path: device.path,
                label: device.label,
                state: null,
                instance,
                instanceLabel: `${device.label} (${instance})`,
                instanceName: null,
                ts: new Date().getTime(),
            }
            changedDevices.push(newDevice);
        }

        newState.devices = otherDevices.concat(changedDevices);

    } else {
        const newDevice: TrezorDevice = {
            ...device,
            acquiring: false,
            remember: false,
            connected: true,
            available: true,
            path: device.path,
            label: device.label,
            state: null,
            instanceLabel: device.label,
            instanceName: null,
            ts: new Date().getTime(),
        }
        newState.devices.push(newDevice);
    }

    return newState;
}

const setDeviceState = (state: State, action: any): State => {
    const newState: State = { ...state };

    //const affectedDevice: ?TrezorDevice = state.devices.find(d => d.path === action.device.path && d.instance === action.device.instance);
    const index: number = state.devices.findIndex(d => d.path === action.device.path && d.instance === action.device.instance);
    if (index > -1) {
        // device could already have own state from firmware, do not override it
        if (!newState.devices[index].state) {
            const changedDevice: TrezorDevice = { 
                ...newState.devices[index],
                state: action.state
            };
            newState.devices[index] = changedDevice;
        }
    }
    return newState;
}

const changeDevice = (state: State, device: Object): State => {

    const newState: State = { ...state };

    let affectedDevices: Array<TrezorDevice> = [];
    let otherDevices: Array<TrezorDevice> = [];
    if (device.features) {
        affectedDevices = state.devices.filter(d => 
            (d.features && d.features.device_id === device.features.device_id && d.features.passphrase_protection === device.features.passphrase_protection) || 
            (d.path.length > 0 && d.path === device.path) 
        );
        otherDevices = state.devices.filter(d => affectedDevices.indexOf(d) === -1);
    } else {
        affectedDevices = state.devices.filter(d => !d.features && d.path === device.path);
        otherDevices = state.devices.filter(d => affectedDevices.indexOf(d) === -1);
        // otherDevices = state.devices.filter(d => d.path !== device.path);
    }

    if (affectedDevices.length > 0) {

        const isAffectedUnacquired: number = affectedDevices.findIndex(d => d.unacquired);
        // if (isAffectedUnacquired >= 0 && affectedDevices.length > 1){
        if (isAffectedUnacquired >= 0){
            // TODO: should unacquired device be removed? or merged?
            //affectedDevices.splice(isAffectedUnacquired, 1);
        } else {
            // replace existing values
            const changedDevices: Array<TrezorDevice> = affectedDevices.map(d => mergeDevices(d, device));
            newState.devices = otherDevices.concat(changedDevices);
        }
        
        // else if (isAffectedUnacquired >= 0 && !device.unacquired && affectedDevices.length > 1) {
        //     affectedDevices.splice(isAffectedUnacquired, 1);
        // }
        // acquiring selected device. remove unnecessary (not acquired) device from list
        // after this action selectedDevice needs to be updated (in TrezorConnectService)
        if (state.selectedDevice && device.path === state.selectedDevice.id && affectedDevices.length > 1) {
            // affectedDevices = affectedDevices.filter(d => d.path !== state.selectedDevice.id && d.features);
        }
    }

    return newState;
}


const disconnectDevice = (state: State, device: Device): State => {

    const newState: State = { ...state };
    const affectedDevices: Array<TrezorDevice> = state.devices.filter(d => d.path === device.path || (d.features && device.features && d.features.device_id === device.features.device_id));
    const otherDevices: Array<TrezorDevice> = state.devices.filter(d => affectedDevices.indexOf(d) === -1);

    if (affectedDevices.length > 0) {
        const acquiredDevices = affectedDevices.filter(d => !d.unacquired && d.state);
        newState.devices = otherDevices.concat( acquiredDevices.map(d => {
            d.connected = false;
            d.available = false;
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
        newState.devices = state.devices.filter(d => d.remember || (d.features && d.features.device_id !== action.device.features.device_id) || (!d.features && d.path !== action.device.path));
    }

    return newState;
}

const devicesFromLocalStorage = (devices: Array<any>): Array<TrezorDevice> => {
    return devices.map(d => {
        return {
            ...d,
            connected: false,
            available: false,
            path: '',
            acquiring: false,
            featuresNeedsReload: false,
            isUsedElsewhere: false
        }
    });
}

const duplicate = (state: State, device: TrezorDevice): State => {
    const newState: State = { ...state };
    // const affectedDevices: Array<TrezorDevice> = state.devices.filter(d => d.features && device.features && d.features.device_id === device.features.device_id)
    // .sort((a, b) => {
    //     if (!a.instance) {
    //         return -1;
    //     } else {
    //         return !b.instance || a.instance > b.instance ? 1 : -1;
    //     }
    // });

    // const instance: number = affectedDevices.reduce((inst, dev) => {
    //     return dev.instance ? dev.instance + 1 : inst + 1;
    // }, 0);

    const instance: number = getNewInstance(state.devices, device);

    const newDevice: TrezorDevice = {
        ...device,
        // acquiring: false,
        remember: false,
        // connected: device.connected,
        // available: device.available,
        // path: device.path,
        // label: device.label,
        state: null,
        instance,
        // instanceLabel: `${device.label} (${instance})`,
        instanceLabel: `${device.label} (${ device.instanceName || instance })`,
        ts: new Date().getTime(),
    }
    newState.devices.push(newDevice);
    newState.selectedDevice = {
        id: newDevice.features ? newDevice.features.device_id : '-empty-',
        instance
    }

    return newState;
}


const onSelectDevice = (state: State, action: any): State => {
    const newState: State = { ...state };
    newState.selectedDevice = action.payload;

    const selected = findSelectedDevice(newState);
    if (selected) {
        selected.ts = new Date().getTime();
    }

    return newState;
}


export default function connect(state: State = initialState, action: Action): State {

    switch (action.type) {

        // TODO: change it to UiMessgae from trezor-connect
        case 'iframe_handshake' : 
            return {
                ...state,
                browserState: action.payload.browser
            }
        
        case CONNECT.DUPLICATE :
            return duplicate(state, action.device);


        case CONNECT.SELECT_DEVICE : 
            return onSelectDevice(state, action);
            // return {
            //     ...state,
            //     selectedDevice: action.payload
            // }

        case CONNECT.INITIALIZATION_ERROR :
            return {
                ...state,
                error: action.error
            };

        case TRANSPORT.START :
            return {
                ...state,
                transport: action.payload,
                error: null
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
        case CONNECT.START_ACQUIRING :
        case CONNECT.STOP_ACQUIRING :
            return changeDevice(state, { ...action.device, acquiring: action.type === CONNECT.START_ACQUIRING } );
        case CONNECT.REMEMBER :
            return changeDevice(state, { ...action.device, path: '', remember: true } );
    
        case CONNECT.FORGET :
        case CONNECT.FORGET_SINGLE :
            return forgetDevice(state, action);

        case DEVICE.CONNECT :
        case DEVICE.CONNECT_UNACQUIRED :
            return addDevice(state, action.device);
        case DEVICE.CHANGED :
            return changeDevice(state, { ...action.device, connected: true, available: true }); // TODO: check if available will propagate to unavailable
        case DEVICE.DISCONNECT :
        case DEVICE.DISCONNECT_UNACQUIRED :
            return disconnectDevice(state, action.device);



        default:
            return state;
    }

}