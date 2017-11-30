/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { UI, DEVICE } from 'trezor-connect';
import * as ComposeTxActions from '../../actions/methods/ComposeTxActions';

type MethodState = {
    coin: string;
    // compose tx
    outputs: Array<ComposeTxOutput>;
    locktime: number;
    locktimeEnabled: boolean;
    push: boolean;
    responseTab: string;
    response: ?Object;
    code: string;
    params: Object;
}

type ComposeTxOutput = {
    type: string;
    address: string;
    opreturn_data: string;
    opreturn_hexdata: boolean;
    amount: number;
    send_max: boolean;
}

const defaultOutput: ComposeTxOutput = {
    type: 'regular',
    address: '2Mu6MwbU4eLdDbRL8fio2oyEfxfv4MKn7Rw',
    opreturn_data: 'dead beef',
    opreturn_hexdata: false,
    amount: 10000,
    send_max: false,
}



const getCode = (params): string => {
    return 'TrezorConnect.composeTransaction(' + JSON.stringify(params, undefined, 2) + ');';    
}

const getParams = (state: MethodState): Object => {
    var params = {
        //selectedDevice: window.selectedDevice,
        coin: state.coin,
    };

    if (state.push) {
        params.push = state.push;
    }

    if (state.locktimeEnabled) {
        params.locktime = parseInt(state.locktime);
    }

    params.outputs = state.outputs.map((out) => {
        if (out.type === 'opreturn') {
            return {
                type: 'opreturn',
                data: out.opreturn_data,
                dataFormat: out.opreturn_hexdata ? 'hex' : 'text'
            }
        } else {
            if (out.send_max) {
                return {
                    address: out.address,
                    type: 'send-max'
                }
            } else {
                return {
                    address: out.address,
                    amount: parseInt(out.amount)
                }
            }
        }
    });

    return params;
}

const updateState = (state: MethodState): MethodState => {
    const params: Object = getParams(state);
    return {
        ...state,
        params,
        code: getCode(params)
    }
}

const initialState: MethodState = {
    coin: 'test',
    outputs: [
        { ...defaultOutput }
    ],
    locktime: 0,
    locktimeEnabled: false,
    push: false,
    responseTab: 'response',
    response: null,
    code: '',
    params: {}
};
initialState.params = getParams(initialState);


export default function method(state: MethodState = initialState, action: any): any {

    let currentOutput: any;
    let newOutputs;

    switch (action.type) {

        case LOCATION_CHANGE: {
            return updateState({ 
                ...initialState,
                outputs: [
                    { ...defaultOutput }
                ]
            });
        }

        case ComposeTxActions.COIN_CHANGE :
            return updateState({
                ...state,
                coin: action.coin
            });

        case ComposeTxActions.OUTPUT_ADD :
            state.outputs.push( { ...defaultOutput } )
            return updateState({
                ...state
            });
        case ComposeTxActions.OUTPUT_REMOVE :
            newOutputs = [ ...state.outputs ];
            newOutputs.splice(action.index, 1);
            return updateState({
                ...state,
                outputs: newOutputs
            });

        case ComposeTxActions.OUTPUT_TYPE_CHANGE :
            currentOutput = state.outputs[action.index];
            currentOutput.type = action.output_type;
            return updateState({
                    ...state
            });

        case ComposeTxActions.OUTPUT_ADDRESS_CHANGE :
            currentOutput = state.outputs[action.index];
            currentOutput.address = action.address;
            return updateState({
                ...state
            });

        case ComposeTxActions.OUTPUT_AMOUNT_CHANGE :
            currentOutput = state.outputs[action.index];
            currentOutput.amount = action.amount;
            return updateState({
                ...state
            });

        case ComposeTxActions.OUTPUT_SEND_MAX :
            currentOutput = state.outputs[action.index];
            currentOutput.send_max = action.status;
            return updateState({
                ...state
            });

        case ComposeTxActions.OPRETURN_DATA_CHANGE :
            currentOutput = state.outputs[action.index];
            currentOutput.opreturn_data = action.value;
            return updateState({
                ...state
            });

        case ComposeTxActions.OPRETURN_DATA_FORMAT_CHANGE :
            currentOutput = state.outputs[action.index];
            currentOutput.opreturn_hexdata = action.status;
            return updateState({
                ...state
            });

        case ComposeTxActions.LOCKTIME_ENABLE :
            return updateState({
                ...state,
                locktimeEnabled: action.status
            });

        case ComposeTxActions.LOCKTIME_CHANGE :
            return updateState({
                ...state,
                locktime: action.value
            });

        case ComposeTxActions.PUSH_CHANGE :
            return updateState({
                ...state,
                push: action.value
            });

        case ComposeTxActions.RESPONSE_TAB_CHANGE :
            return updateState({
                ...state,
                responseTab: action.tab
            });
        
        case ComposeTxActions.COMPOSETX_RESPONSE :
            return {
                ...state,
                response: action.response,
                responseTab: 'response'
            };

        default:
            return state;
    }

}