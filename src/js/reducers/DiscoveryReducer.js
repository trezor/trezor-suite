/* @flow */
'use strict';

import HDKey from 'hdkey';

import * as DISCOVERY from '../actions/constants/discovery';
import * as ADDRESS from '../actions/constants/address';
import * as CONNECT from '../actions/constants/TrezorConnect';

import type { Action, TrezorDevice } from '../flowtype';
import type { 
    DiscoveryStartAction,
    DiscoveryWaitingAction,
    DiscoveryStopAction,
    DiscoveryCompleteAction
} from '../actions/DiscoveryActions';

import type {
    AddressCreateAction
} from '../actions/AddressActions'

export type Discovery = {
    network: string;
    xpub: string;
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

const findIndex = (state: State, network: string, deviceState: string): number => {
    return state.findIndex(d => d.network === network && d.deviceState === deviceState);
}

const start = (state: State, action: DiscoveryStartAction): State => {
    const deviceState: string = action.device.state || '0';
    const instance: Discovery = {
        network: action.network,
        xpub: action.xpub,
        hdKey: action.hdKey,
        basePath: action.basePath,
        deviceState,
        accountIndex: 0,
        interrupted: false,
        completed: false,
        waitingForDevice: false,
        waitingForBackend: false,
    }

    const newState: State = [ ...state ];
    const index: number = findIndex(state, action.network, deviceState);
    if (index >= 0) {
        newState[index] = instance;
    } else {
        newState.push(instance);
    }
    return newState;
}

const complete = (state: State, action: DiscoveryCompleteAction): State => {
    const index: number = findIndex(state, action.network, action.device.state || '0');
    const newState: State = [ ...state ];
    newState[index].completed = true;
    return newState;
}

const addressCreate = (state: State, action: AddressCreateAction): State => {
    const index: number = findIndex(state, action.network, action.device.state || '0');
    const newState: State = [ ...state ];
    newState[index].accountIndex++;
    return newState;
}

const forgetDiscovery = (state: State, device: TrezorDevice): State => {
    return state.filter(d => d.deviceState !== device.state);
}

const stop = (state: State, action: DiscoveryStopAction): State => {
    const newState: State = [ ...state ];
    return newState.map( (d: Discovery) => {
        if (d.deviceState === action.device.state && !d.completed) {
            d.interrupted = true;
            d.waitingForDevice = false;
        }
        return d;
    });
}

const waitingForDevice = (state: State, action: DiscoveryWaitingAction): State => {

    const deviceState: string = action.device.state || '0';
    const instance: Discovery = {
        network: action.network,
        deviceState,
        xpub: '',
        hdKey: null,
        basePath: [],
        accountIndex: 0,
        interrupted: false,
        completed: false,
        waitingForDevice: true,
        waitingForBackend: false,
    }

    const index: number = findIndex(state, action.network, deviceState);
    const newState: State = [ ...state ];
    if (index >= 0) {
        newState[index] = instance;
    } else {
        newState.push(instance);
    }

    return newState;
}

const waitingForBackend = (state: State, action: DiscoveryWaitingAction): State => {
    const deviceState: string = action.device.state || '0';
    const instance: Discovery = {
        network: action.network,
        deviceState,
        xpub: '',
        hdKey: null,
        basePath: [],
        accountIndex: 0,
        interrupted: false,
        completed: false,
        waitingForDevice: false,
        waitingForBackend: true
    }

    const index: number = findIndex(state, action.network, deviceState);
    const newState: State = [ ...state ];
    if (index >= 0) {
        newState[index] = instance;
    } else {
        newState.push(instance);
    }

    return newState;
}

export default function discovery(state: State = initialState, action: Action): State {

    switch (action.type) {
        case DISCOVERY.START :
            return start(state, action);
        case ADDRESS.CREATE :
            return addressCreate(state, action);
        case DISCOVERY.STOP :
            return stop(state, action);
        case DISCOVERY.COMPLETE :
            return complete(state, action);
        case DISCOVERY.WAITING_FOR_DEVICE :
            return waitingForDevice(state, action);
        case DISCOVERY.WAITING_FOR_BACKEND :
            return waitingForBackend(state, action);
        case DISCOVERY.FROM_STORAGE :
            return action.payload.map(d => {
                return {
                    ...d,
                    interrupted: false,
                    waitingForDevice: false,
                    waitingForBackend: false,
                }
            })
        case CONNECT.FORGET :
        case CONNECT.FORGET_SINGLE :
            return forgetDiscovery(state, action.device);

        default:
            return state;
    }

}