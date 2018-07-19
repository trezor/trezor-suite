/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { UI, DEVICE } from 'trezor-connect';
import { COIN_CHANGE, TX_CHANGE } from '../../actions/methods/PushTxActions';

type MethodState = {
    +js: string;
    fields: Array<string>;

    coin: string;
    tx: string;
}

const initialState: MethodState = {
    js: 'TrezorConnect.pushTransaction',
    fields: ['tx', 'coin'],
    coin: '',
    tx: '',
};


export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        case LOCATION_CHANGE :
            return initialState;

        case COIN_CHANGE :
            return {
                ...state,
                coin: action.coin,
            };

        case TX_CHANGE :
            return {
                ...state,
                tx: action.tx
            };

        default:
            return state;
    }

}