/* @flow */
'use strict';

import HDKey from 'hdkey';
import EthereumjsUtil from 'ethereumjs-util';

import * as ACTIONS from '../actions';
import BigNumber from 'bignumber.js';
import { access, stat } from 'fs';

type AddressType = {
    devicePath: string;
    index: number;
    path: Array<number>;
    address: string;
}

type State = {
    addresses: Array<Address>;
    pendingTxs: Array<string>;
}

const initialState: State = {
    addresses: [],
    pendingTxs: [],
};

export class Address {

    devicePath: string;
    index: number;
    path: Array<number>;
    address: string;
    balance: string;
    pendingTx: Array<any>;
    history: JSON;

    constructor(devicePath: string, index: number, path: Array<number>, address: string) {
        this.devicePath = devicePath;
        this.index = index;
        this.path = path;
        this.address = address;
        this.pendingTx = [];
    }

    setBalance(balance: string): void {
        this.balance = balance;
    }

    setHistory(json): void {
        this.history = json;
    }

    addPendingTx(txid, txData): void {
        this.pendingTx.push({
            txid,
            txData
        });
    }

    findPendingTx(txid): boolean {
        let index = this.pendingTx.findIndex(tx => tx.txid === txid);
        return index >= 0;
    }

    removePendingTx(txid): void {
        let index = this.pendingTx.findIndex(tx => tx.txid === txid);
        if (index >= 0) {
            this.pendingTx.splice(index, 1);
            console.error("-----> RMEOVE PENDiNG TX", this.pendingTx)
        }
    }
}

export default (state: State = initialState, action: any): State => {

    switch (action.type) {

        case ACTIONS.ON_TX_COMPLETE : 
            action.address.addPendingTx(action.txid, action.txData);
            state.pendingTxs.push(action.txid);
            return {
                ...state,
            }

        case ACTIONS.TX_STATUS_OK :
            for (let addr of state.addresses) {
                addr.removePendingTx(action.txid);
            }
            let pendingIndex = state.pendingTxs.indexOf(action.txid);
            if (pendingIndex >= 0) {
                state.pendingTxs.splice(pendingIndex, 1);
            }
            return {
                ...state,
            }

        break;
        
        case ACTIONS.ADDRESS_CREATE :
            return {
                ...state,
                addresses: state.addresses.concat([ action.address ])
            }

        case ACTIONS.ADDRESS_SET_BALANCE :
            action.address.setBalance( action.balance );
            return {
                ...state,
            }
        
        case ACTIONS.ADDRESS_SET_HISTORY :
            action.address.setHistory( action.history );
            return {
                ...state,
            }

        case ACTIONS.ADDRESS_DELETE :
            return {
                ...state,
                addresses: action.addresses
            }
        default:
            return state;
    }

}