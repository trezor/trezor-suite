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
    waitingForBlockchain: boolean;
}

export type State = Array<Discovery>;
const initialState: State = [];

const findIndex = (state: State, network: string, deviceState: string): number => state.findIndex(d => d.network === network && d.deviceState === deviceState);

const start = (state: State, action: DiscoveryStartAction): State => {
    const deviceState: string = action.device.state || '0';
    const hdKey: HDKey = new HDKey();
    hdKey.publicKey = Buffer.from(action.publicKey, 'hex');
    hdKey.chainCode = Buffer.from(action.chainCode, 'hex');
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
        waitingForBlockchain: false,
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

const stop = (state: State, device: TrezorDevice): State => {
    const affectedProcesses = state.filter(d => d.deviceState === device.state && !d.completed);
    const otherProcesses = state.filter(d => affectedProcesses.indexOf(d) === -1);
    const changedProcesses = affectedProcesses.map(d => ({
        ...d,
        interrupted: true,
        waitingForDevice: false,
        waitingForBlockchain: false,
    }));

    return otherProcesses.concat(changedProcesses);
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
        waitingForBlockchain: false,
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

const waitingForBlockchain = (state: State, action: DiscoveryWaitingAction): State => {
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
        waitingForBlockchain: true,
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
            return stop(state, action.device);
        case DISCOVERY.COMPLETE:
            return complete(state, action);
        case DISCOVERY.WAITING_FOR_DEVICE:
            return waitingForDevice(state, action);
        case DISCOVERY.WAITING_FOR_BLOCKCHAIN:
            return waitingForBlockchain(state, action);
        case DISCOVERY.FROM_STORAGE:
            return action.payload.map((d) => {
                const hdKey: HDKey = new HDKey();
                hdKey.publicKey = Buffer.from(d.publicKey, 'hex');
                hdKey.chainCode = Buffer.from(d.chainCode, 'hex');
                return {
                    ...d,
                    hdKey,
                    interrupted: false,
                    waitingForDevice: false,
                    waitingForBlockchain: false,
                };
            });
        case CONNECT.FORGET:
        case CONNECT.FORGET_SINGLE:
        case CONNECT.FORGET_SILENT:
        case CONNECT.RECEIVE_WALLET_TYPE:
            return forgetDiscovery(state, action.device);
        case WALLET.CLEAR_UNAVAILABLE_DEVICE_DATA:
            return clear(state, action.devices);

        default:
            return state;
    }
}