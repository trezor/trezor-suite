/* @flow */


import { TRANSPORT, DEVICE } from 'trezor-connect';
import type { Device } from 'trezor-connect';
import * as CONNECT from '../actions/constants/TrezorConnect';
import * as WALLET from '../actions/constants/wallet';

import type { Action, TrezorDevice } from '~/flowtype';

export type State = Array<TrezorDevice>;

const initialState: State = [];

const mergeDevices = (current: TrezorDevice, upcoming: Device | TrezorDevice): TrezorDevice => {
    // do not merge if passphrase protection was changed
    // if (upcoming.features && current.features) {
    //     if (upcoming.features.passphrase_protection !== current.features.passphrase_protection) {
    //         // device settings has been changed, reset state
    //         // dev.state = null;
    //     }
    // }

    let instanceLabel = current.instanceLabel;
    if (upcoming.label !== current.label) {
        instanceLabel = upcoming.label;
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
        instanceName: typeof upcoming.instanceName === 'string' ? upcoming.instanceName : current.instanceName,
        state: current.state,
        ts: typeof upcoming.ts === 'number' ? upcoming.ts : current.ts,
    };
    // corner-case: trying to merge unacquired device with acquired
    // make sure that sensitive fields will not be changed and device will remain acquired
    if (upcoming.unacquired && current.state) {
        dev.unacquired = false;
        dev.features = current.features;
        dev.label = current.label;
    }

    return dev;
};

const addDevice = (state: State, device: Device): State => {
    let affectedDevices: Array<TrezorDevice> = [];
    let otherDevices: Array<TrezorDevice> = [];
    if (!device.features) {
        // check if connected device is unacquired, and it's already exists
        affectedDevices = state.filter(d => d.path === device.path);
        // if so, ignore this action
        if (affectedDevices.length > 0) {
            return state;
        }
        otherDevices = state.filter(d => affectedDevices.indexOf(d) === -1);
    } else {
        affectedDevices = state.filter(d => d.features && d.features.device_id === device.features.device_id);
        const unacquiredDevices = state.filter(d => d.path.length > 0 && d.path === device.path);
        otherDevices = state.filter(d => affectedDevices.indexOf(d) < 0 && unacquiredDevices.indexOf(d) < 0);
    }

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
    };

    if (affectedDevices.length > 0) {
        // check if freshly added device has different "passphrase_protection" settings

        // let hasDifferentPassphraseSettings: boolean = false;
        // let hasInstancesWithPassphraseSettings: boolean = false;
        // const changedDevices: Array<TrezorDevice> = affectedDevices.map(d => {
        //     if (d.features && d.features.passphrase_protection === device.features.passphrase_protection) {
        //         hasInstancesWithPassphraseSettings = true;
        //         return mergeDevices(d, { ...device, connected: true, available: true } );
        //     } else {
        //         hasDifferentPassphraseSettings = true;
        //         d.connected = true;
        //         d.available = false;
        //         return d;
        //     }
        // });

        // edge case: freshly connected device has different "passphrase_protection" than saved instances
        // need to automatically create another instance with default instance name
        // if (hasDifferentPassphraseSettings && !hasInstancesWithPassphraseSettings) {
        //     const instance = getNewInstance(affectedDevices, device);

        //     newDevice.instance = instance;
        //     newDevice.instanceLabel = `${device.label} (${instance})`;

        //     changedDevices.push(newDevice);
        // }

        const changedDevices: Array<TrezorDevice> = affectedDevices.filter(d => d.features && d.features.passphrase_protection === device.features.passphrase_protection).map(d => mergeDevices(d, { ...device, connected: true, available: true }));
        if (changedDevices.length !== affectedDevices.length) {
            changedDevices.push(newDevice);
        }

        return otherDevices.concat(changedDevices);
    }
    return otherDevices.concat([newDevice]);
};


const duplicate = (state: State, device: TrezorDevice): State => {
    if (!device.features) return state;

    const newState: State = [...state];

    const instance: number = getNewInstance(state, device);

    const newDevice: TrezorDevice = {
        ...device,
        // acquiring: false,
        remember: false,
        state: null,
        // instance, (instance is already part of device - added in modal)
        instanceLabel: `${device.label} (${device.instanceName || instance})`,
        ts: new Date().getTime(),
    };
    newState.push(newDevice);

    return newState;
};

const changeDevice = (state: State, device: Device): State => {
    // change only acquired devices
    if (!device.features) return state;

    // find devices with the same device_id and passphrase_protection settings
    // or devices with the same path (TODO: should be that way?)
    const affectedDevices: Array<TrezorDevice> = state.filter(d => (d.features && d.features.device_id === device.features.device_id && d.features.passphrase_protection === device.features.passphrase_protection)
        || (d.features && d.path.length > 0 && d.path === device.path));

    const otherDevices: Array<TrezorDevice> = state.filter(d => affectedDevices.indexOf(d) === -1);

    if (affectedDevices.length > 0) {
        // merge incoming device with State
        const changedDevices = affectedDevices.map(d => mergeDevices(d, device));
        return otherDevices.concat(changedDevices);
    }

    return state;
};

const authDevice = (state: State, device: TrezorDevice, deviceState: string): State => {
    const affectedDevice: ?TrezorDevice = state.find(d => d.path === device.path && d.instance === device.instance);
    // device could already have own state from trezor-connect, do not override it
    if (affectedDevice && !affectedDevice.state) {
        const otherDevices: Array<TrezorDevice> = state.filter(d => d !== affectedDevice);
        affectedDevice.state = deviceState;
        return otherDevices.concat([affectedDevice]);
    }
    return state;
};


// Transform JSON form local storage into State
const devicesFromStorage = (devices: Array<TrezorDevice>): State => devices.map((d: TrezorDevice) => ({
    ...d,
    connected: false,
    available: false,
    path: '',
    acquiring: false,
    featuresNeedsReload: false,
    isUsedElsewhere: false,
}));

// Remove all device reference from State
const forgetDevice = (state: State, device: TrezorDevice): State => state.filter(d => d.remember || (d.features && device.features && d.features.device_id !== device.features.device_id) || (!d.features && d.path !== device.path));


// Remove single device reference from State
const forgetSingleDevice = (state: State, device: TrezorDevice): State => {
    // remove only one instance (called from Aside button)
    const newState: State = [...state];
    newState.splice(newState.indexOf(device), 1);
    return newState;
};

const disconnectDevice = (state: State, device: Device): State => {
    const affectedDevices: State = state.filter(d => d.path === device.path || (d.features && device.features && d.features.device_id === device.features.device_id));
    const otherDevices: State = state.filter(d => affectedDevices.indexOf(d) === -1);

    if (affectedDevices.length > 0) {
        const acquiredDevices = affectedDevices.filter(d => !d.unacquired && d.state);
        return otherDevices.concat(acquiredDevices.map((d) => {
            d.connected = false;
            d.available = false;
            d.isUsedElsewhere = false;
            d.featuresNeedsReload = false;
            d.path = '';
            return d;
        }));
    }

    return state;
};

const onSelectedDevice = (state: State, device: ?TrezorDevice): State => {
    if (device) {
        const otherDevices: Array<TrezorDevice> = state.filter(d => d !== device);
        return otherDevices.concat([{ ...device, ts: new Date().getTime() }]);
    }
    return state;
};

export default function devices(state: State = initialState, action: Action): State {
    switch (action.type) {
        case CONNECT.DEVICE_FROM_STORAGE:
            return devicesFromStorage(action.payload);

        case CONNECT.DUPLICATE:
            return duplicate(state, action.device);

        case CONNECT.AUTH_DEVICE:
            return authDevice(state, action.device, action.state);

        case CONNECT.REMEMBER:
            return changeDevice(state, { ...action.device, path: '', remember: true });

        case CONNECT.FORGET:
            return forgetDevice(state, action.device);
        case CONNECT.FORGET_SINGLE:
            return forgetSingleDevice(state, action.device);

        case DEVICE.CONNECT:
        case DEVICE.CONNECT_UNACQUIRED:
            return addDevice(state, action.device);

        case DEVICE.CHANGED:
            return changeDevice(state, { ...action.device, connected: true, available: true });
            // TODO: check if available will propagate to unavailable

        case DEVICE.DISCONNECT:
        case DEVICE.DISCONNECT_UNACQUIRED:
            return disconnectDevice(state, action.device);

        case WALLET.SET_SELECTED_DEVICE:
            return onSelectedDevice(state, action.device);

        default:
            return state;
    }
}

// UTILS

export const getNewInstance = (devices: State, device: Device | TrezorDevice): number => {
    const affectedDevices: State = devices.filter(d => d.features && device.features && d.features.device_id === device.features.device_id)
        .sort((a, b) => {
            if (!a.instance) {
                return -1;
            }
            return !b.instance || a.instance > b.instance ? 1 : -1;
        });

    const instance: number = affectedDevices.reduce((inst, dev) => (dev.instance ? dev.instance + 1 : inst + 1), 0);

    return instance;
};