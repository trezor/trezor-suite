/* @flow */
'use strict';

import * as DISCOVERY from '../actions/constants/Discovery';
import * as ADDRESS from '../actions/constants/Address';
import * as CONNECT from '../actions/constants/TrezorConnect';

export type Discovery = {
    coin: string;
    checksum: string;
    xpub: string;
    accountIndex: number;
    interrupted: boolean;
    completed: boolean;
    waitingForDevice: boolean;
    waitingForAuth?: boolean;
}

const initialState: Array<Discovery> = [];

const start = (state: Array<Discovery>, action: any): Array<Discovery> => {

    const instance: Discovery = {
        coin: action.coin,
        xpub: action.xpub,
        hdKey: action.hdKey,
        basePath: action.basePath,
        checksum: action.device.checksum,
        accountIndex: 0,
        interrupted: false,
        completed: false,
        waitingForDevice: false
    }

    const newState: Array<Discovery> = [ ...state ];
    const index: number = state.findIndex(d => {
        return d.coin === action.coin && d.checksum === action.device.checksum;
    });

    console.warn("START DISCO", index);

    if (index >= 0) {
        newState[index] = instance;
    } else {
        newState.push(instance);
    }
    return newState;
}

const complete = (state: Array<Discovery>, action: any): Array<Discovery> => {
    const index: number = state.findIndex(d => {
        return d.coin === action.coin && d.checksum === action.device.checksum;
    });
    const newState: Array<Discovery> = [ ...state ];
    newState[index].completed = true;
    return newState;
}

const addressCreate = (state: Array<Discovery>, action: any): Array<Discovery> => {
    const index: number = state.findIndex(d => {
        return d.coin === action.coin && d.checksum === action.device.checksum;
    });
    const newState: Array<Discovery> = [ ...state ];
    newState[index].accountIndex++;
    return newState;
}

const forgetDiscovery = (state: Array<Discovery>, action: any): Array<Discovery> => {
    return state.filter(d => d.checksum !== action.device.checksum);
}

const stop = (state: Array<Discovery>, action: any): Array<Discovery> => {
    const newState: Array<Discovery> = [ ...state ];
    return newState.map( (d: Discovery) => {
        if (d.checksum === action.device.checksum && !d.completed) {
            d.interrupted = true;
            d.waitingForDevice = false;
        }
        return d;
    });
}

const waiting = (state: Array<Discovery>, action: any): Array<Discovery> => {

    const instance: Discovery = {
        coin: action.coin,
        checksum: action.device.checksum,
        xpub: '',
        accountIndex: 0,
        interrupted: false,
        completed: false,
        waitingForDevice: true
    }

    const index: number = state.findIndex(d => {
        return d.coin === action.coin && d.checksum === action.device.checksum;
    });

    const newState: Array<Discovery> = [ ...state ];
    if (index >= 0) {
        newState[index] = instance;
    } else {
        newState.push(instance);
    }

    return newState;
}

export default function discovery(state: Array<Discovery> = initialState, action: any): any {

    switch (action.type) {
        case DISCOVERY.START :
            return start(state, action);
        case ADDRESS.CREATE :
            return addressCreate(state, action);
        case DISCOVERY.STOP :
            return stop(state, action);
        case DISCOVERY.COMPLETE :
            return complete(state, action);
        case DISCOVERY.WAITING :
            return waiting(state, action)
        case DISCOVERY.FROM_STORAGE :
            return action.payload.map(d => {
                return {
                    ...d,
                    interrupted: false,
                    waitingForDevice: false
                }
            })
        case CONNECT.FORGET :
        case CONNECT.FORGET_SINGLE :
            return forgetDiscovery(state, action);

        default:
            return state;
    }

}