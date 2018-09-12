/* @flow */


import HDKey from 'hdkey';

import * as DISCOVERY from 'actions/constants/discovery';
import * as ACCOUNT from 'actions/constants/account';
import * as CONNECT from 'actions/constants/TrezorConnect';
import * as WALLET from 'actions/constants/wallet';

import type { Action, TrezorDevice } from 'flowtype';
import type {
    DiscoveryStartAction,
    DiscoveryWaitingAction,
    DiscoveryStopAction,
    DiscoveryCompleteAction,
} from 'actions/DiscoveryActions';

import type { Account } from './AccountsReducer';

export type Discovery = {
    network: string;
    publicKey: string;
    chainCode: string;
    hdKey: HDKey;
    basePath: Array<number>;
    deviceState: string;
    accountIndex: number;
    interrupted: boolean;
    completed: boolean;
    waitingForDevice: boolean;
    waitingForBackend: boolean;
}

export type State = Array<Discovery>;
const initialState: State = [];

const findIndex = (state: State, network: string, deviceState: string): number => state.findIndex(d => d.network === network && d.deviceState === deviceState);

const start = (state: State, action: DiscoveryStartAction): State => {
    const deviceState: string = action.device.state || '0';
    const hdKey: HDKey = new HDKey();
    hdKey.publicKey = new Buffer(action.publicKey, 'hex');
    hdKey.chainCode = new Buffer(action.chainCode, 'hex');
    const instance: Discovery = {
        network: action.network,
        publicKey: action.publicKey,
        chainCode: action.chainCode,
        hdKey,
        basePath: action.basePath,
        deviceState,
        accountIndex: 0,
        interrupted: false,
        completed: false,
        waitingForDevice: false,
        waitingForBackend: false,
    };

    const newState: State = [...state];
    const index: number = findIndex(state, action.network, deviceState);
    if (index >= 0) {
        newState[index] = instance;
    } else {
        newState.push(instance);
    }
    return newState;
};

const complete = (state: State, action: DiscoveryCompleteAction): State => {
    const index: number = findIndex(state, action.network, action.device.state || '0');
    const newState: State = [...state];
    newState[index] = { ...newState[index], completed: true };
    return newState;
};

const accountCreate = (state: State, account: Account): State => {
    const index: number = findIndex(state, account.network, account.deviceState);
    const newState: State = [...state];
    newState[index].accountIndex++;
    return newState;
};

const forgetDiscovery = (state: State, device: TrezorDevice): State => state.filter(d => d.deviceState !== device.state);

const clear = (state: State, devices: Array<TrezorDevice>): State => {
    let newState: State = [...state];
    devices.forEach((d) => {
        newState = forgetDiscovery(newState, d);
    });
    return newState;
};

const stop = (state: State, action: DiscoveryStopAction): State => {
    const newState: State = [...state];
    return newState.map((d: Discovery) => {
        if (d.deviceState === action.device.state && !d.completed) {
            d.interrupted = true;
            d.waitingForDevice = false;
        }
        return d;
    });
};

const waitingForDevice = (state: State, action: DiscoveryWaitingAction): State => {
    const deviceState: string = action.device.state || '0';
    const instance: Discovery = {
        network: action.network,
        deviceState,
        publicKey: '',
        chainCode: '',
        hdKey: null,
        basePath: [],
        accountIndex: 0,
        interrupted: false,
        completed: false,
        waitingForDevice: true,
        waitingForBackend: false,
    };

    const index: number = findIndex(state, action.network, deviceState);
    const newState: State = [...state];
    if (index >= 0) {
        newState[index] = instance;
    } else {
        newState.push(instance);
    }

    return newState;
};

const waitingForBackend = (state: State, action: DiscoveryWaitingAction): State => {
    const deviceState: string = action.device.state || '0';
    const instance: Discovery = {
        network: action.network,
        deviceState,
        publicKey: '',
        chainCode: '',
        hdKey: null,
        basePath: [],
        accountIndex: 0,
        interrupted: false,
        completed: false,
        waitingForDevice: false,
        waitingForBackend: true,
    };

    const index: number = findIndex(state, action.network, deviceState);
    const newState: State = [...state];
    if (index >= 0) {
        newState[index] = instance;
    } else {
        newState.push(instance);
    }

    return newState;
};

export default function discovery(state: State = initialState, action: Action): State {
    switch (action.type) {
        case DISCOVERY.START:
            return start(state, action);
        case ACCOUNT.CREATE:
            return accountCreate(state, action.payload);
        case DISCOVERY.STOP:
            return stop(state, action);
        case DISCOVERY.COMPLETE:
            return complete(state, action);
        case DISCOVERY.WAITING_FOR_DEVICE:
            return waitingForDevice(state, action);
        case DISCOVERY.WAITING_FOR_BACKEND:
            return waitingForBackend(state, action);
        case DISCOVERY.FROM_STORAGE:
            return action.payload.map((d) => {
                const hdKey: HDKey = new HDKey();
                hdKey.publicKey = new Buffer(d.publicKey, 'hex');
                hdKey.chainCode = new Buffer(d.chainCode, 'hex');
                return {
                    ...d,
                    hdKey,
                    interrupted: false,
                    waitingForDevice: false,
                    waitingForBackend: false,
                };
            });
        case CONNECT.FORGET:
        case CONNECT.FORGET_SINGLE:
            return forgetDiscovery(state, action.device);
        case WALLET.CLEAR_UNAVAILABLE_DEVICE_DATA:
            return clear(state, action.devices);

        default:
            return state;
    }
}