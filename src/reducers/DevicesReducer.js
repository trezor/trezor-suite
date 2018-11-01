/* @flow */

import { DEVICE } from 'trezor-connect';
import type { Device } from 'trezor-connect';
import * as CONNECT from 'actions/constants/TrezorConnect';
import * as WALLET from 'actions/constants/wallet';
import { getDuplicateInstanceNumber } from 'reducers/utils';

import type { Action, TrezorDevice } from 'flowtype';

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

    let { instanceLabel } = current;
    if (upcoming.label !== current.label) {
        instanceLabel = upcoming.label;
        if (typeof current.instance === 'number') {
            instanceLabel += ` (${current.instanceName || current.instance})`;
        }
    }

    const extended = {
        connected: typeof upcoming.connected === 'boolean' ? upcoming.connected : current.connected,
        available: typeof upcoming.available === 'boolean' ? upcoming.available : current.available,
        remember: typeof upcoming.remember === 'boolean' ? upcoming.remember : current.remember,
        instance: current.instance,
        instanceLabel,
        instanceName: typeof upcoming.instanceName === 'string' ? upcoming.instanceName : current.instanceName,
        state: current.state,
        ts: typeof upcoming.ts === 'number' ? upcoming.ts : current.ts,
        useEmptyPassphrase: typeof upcoming.useEmptyPassphrase === 'boolean' ? upcoming.useEmptyPassphrase : current.useEmptyPassphrase,
    };

    if (upcoming.type === 'acquired') {
        return { ...upcoming, ...extended };
    } if (upcoming.type === 'unacquired' && current.features && current.state) {
        // corner-case: trying to merge unacquired device with acquired
        // make sure that sensitive fields will not be changed and device will remain acquired
        return {
            type: 'acquired',
            path: upcoming.path,
            ...current,
            ...extended,
        };
    }
    return {
        ...upcoming,
        features: null,
        ...extended,
    };
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
        affectedDevices = state.filter(d => d.features
            && device.features
            && d.features.device_id === device.features.device_id);
        const unacquiredDevices = state.filter(d => d.path.length > 0 && d.path === device.path);
        otherDevices = state.filter(d => affectedDevices.indexOf(d) < 0 && unacquiredDevices.indexOf(d) < 0);
    }

    const extended = {
        remember: false,
        connected: true,
        available: true,
        path: device.path,
        label: device.label,
        state: null,
        instanceLabel: device.label,
        instanceName: null,
        ts: new Date().getTime(),
        useEmptyPassphrase: true,
    };


    const newDevice: TrezorDevice = device.type === 'acquired' ? {
        ...device,
        ...extended,
    } : {
        ...device,
        features: null,
        ...extended,
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
        //     const instance = getDuplicateInstanceNumber(affectedDevices, device);

        //     newDevice.instance = instance;
        //     newDevice.instanceLabel = `${device.label} (${instance})`;

        //     changedDevices.push(newDevice);
        // }

        const changedDevices: Array<TrezorDevice> = affectedDevices.filter(d => d.features && device.features
            && d.features.passphrase_protection === device.features.passphrase_protection).map((d) => {
            const extended2: Object = { connected: true, available: true };
            return mergeDevices(d, { ...device, ...extended2 });
        });
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

    const instance: number = getDuplicateInstanceNumber(state, device);

    const newDevice: TrezorDevice = {
        ...device,
        remember: false,
        state: null,
        // instance, (instance is already part of device - added in modal)
        instanceLabel: `${device.label} (${device.instanceName || instance})`,
        ts: new Date().getTime(),
    };
    newState.push(newDevice);

    return newState;
};

const changeDevice = (state: State, device: Device | TrezorDevice, extended: Object): State => {
    // change only acquired devices
    if (!device.features) return state;

    // find devices with the same device_id and passphrase_protection settings
    // or devices with the same path (TODO: should be that way?)
    const affectedDevices: Array<TrezorDevice> = state.filter(d => (d.features && device.features && d.features.device_id === device.features.device_id && d.features.passphrase_protection === device.features.passphrase_protection)
        || (d.features && d.path.length > 0 && d.path === device.path));

    const otherDevices: Array<TrezorDevice> = state.filter(d => affectedDevices.indexOf(d) === -1);

    if (affectedDevices.length > 0) {
        // merge incoming device with State
        const changedDevices = affectedDevices.map(d => mergeDevices(d, { ...device, ...extended }));
        return otherDevices.concat(changedDevices);
    }

    return state;
};

const authDevice = (state: State, device: TrezorDevice, deviceState: string): State => {
    const affectedDevice: ?TrezorDevice = state.find(d => d.path === device.path && d.instance === device.instance);
    // device could already have own state from trezor-connect, do not override it
    if (affectedDevice && !affectedDevice.state && affectedDevice.type === 'acquired') {
        const otherDevices: Array<TrezorDevice> = state.filter(d => d !== affectedDevice);
        return otherDevices.concat([{ ...affectedDevice, state: deviceState }]);
    }
    return state;
};


// Transform JSON form local storage into State
const devicesFromStorage = ($devices: Array<TrezorDevice>): State => $devices.map((device: TrezorDevice) => {
    const extended = {
        connected: false,
        available: false,
        path: '',
    };

    return device.type === 'acquired' ? {
        ...device,
        ...extended,
    } : {
        ...device,
        features: null,
        ...extended,
    };
});

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
        const acquiredDevices = affectedDevices.filter(d => d.features && d.state).map((d) => { // eslint-disable-line arrow-body-style
            return d.type === 'acquired' ? {
                ...d,
                connected: false,
                available: false,
                status: 'available',
                path: '',
            } : d;
        });
        return otherDevices.concat(acquiredDevices);
    }

    return state;
};

const onSelectedDevice = (state: State, device: ?TrezorDevice): State => {
    if (!device) return state;

    const otherDevices: Array<TrezorDevice> = state.filter(d => d !== device);
    const extended = device.type === 'acquired' ? {
        ...device,
        ts: new Date().getTime(),
    } : {
        ...device,
        features: null,
        ts: new Date().getTime(),
    };
    return otherDevices.concat([extended]);
};

const onChangeWalletType = (state: State, device: TrezorDevice, hidden: boolean): State => {
    const affectedDevices: State = state.filter(d => d.path === device.path || (d.features && device.features && d.features.device_id === device.features.device_id));
    const otherDevices: State = state.filter(d => affectedDevices.indexOf(d) === -1);
    if (affectedDevices.length > 0) {
        const changedDevices = affectedDevices.map((d) => { // eslint-disable-line arrow-body-style
            return d.type === 'acquired' ? {
                ...d,
                remember: false,
                state: null,
                useEmptyPassphrase: !hidden,
                ts: new Date().getTime(),
            } : d;
        });
        return otherDevices.concat(changedDevices);
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
            // return changeDevice(state, { ...action.device, path: '', remember: true });
            return changeDevice(state, action.device, { path: '', remember: true });

        case CONNECT.FORGET:
            return forgetDevice(state, action.device);
        case CONNECT.FORGET_SINGLE:
        case CONNECT.FORGET_SILENT:
            return forgetSingleDevice(state, action.device);

        case DEVICE.CONNECT:
        case DEVICE.CONNECT_UNACQUIRED:
            return addDevice(state, action.device);

        case DEVICE.CHANGED:
            // return changeDevice(state, { ...action.device, connected: true, available: true });
            return changeDevice(state, action.device, { connected: true, available: true });
            // TODO: check if available will propagate to unavailable

        case DEVICE.DISCONNECT:
        // case DEVICE.DISCONNECT_UNACQUIRED:
            return disconnectDevice(state, action.device);

        case WALLET.SET_SELECTED_DEVICE:
            return onSelectedDevice(state, action.device);

        case CONNECT.RECEIVE_WALLET_TYPE:
        case CONNECT.UPDATE_WALLET_TYPE:
            return onChangeWalletType(state, action.device, action.hidden);

        default:
            return state;
    }
}