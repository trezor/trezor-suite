/* @flow */

import { LOCATION_CHANGE } from 'connected-react-router';
import { COIN_CHANGE, OUTPUTS_CHANGE, PUSH_CHANGE, LOCKTIME_ENABLE, LOCKTIME_CHANGE } from '../../actions/methods/ComposeTxActions';


type MethodState = {
    +js: string;
    +fields: Array<string>;

    coin: string;
    outputs: string;
    // locktime: number;
    // locktimeEnabled: boolean;
    push: boolean;
}

const defaultOutputs1: string = 
`[{
    amount: '200000',
    address: '2Mu6MwbU4eLdDbRL8fio2oyEfxfv4MKn7Rw',
}]`;
const defaultOutputs: string = 
`[{
    amount: '20000',
    address: 'bitcoincash:qrjgzvp26w92hgg06h69zxuarxtlsryzwg7wecq0mn',
}]`;


const initialState: MethodState = {
    js: 'TrezorConnect.composeTransaction',
    fields: ['coin', 'outputs', 'push'],

    coin: 'bch',
    outputs: defaultOutputs,
    // locktime: 0,
    // locktimeEnabled: false,
    push: false,
};


export default function method(state: MethodState = initialState, action: any): any {


    switch (action.type) {

        case LOCATION_CHANGE :
            return initialState;

        case COIN_CHANGE :
            return {
                ...state,
                coin: action.coin
            };

        case OUTPUTS_CHANGE :
            return {
                ...state,
                outputs: action.outputs
            };
        
        // case LOCKTIME_ENABLE :
        //     return {
        //         ...state,
        //         fields: action.status ? ['coin', 'outputs', 'push', 'locktime'] : ['coin', 'outputs', 'push'],
        //         locktimeEnabled: action.status
        //     };

        // case LOCKTIME_CHANGE :
        //     return {
        //         ...state,
        //         locktime: action.value
        //     };

        case PUSH_CHANGE :
            return {
                ...state,
                push: action.push
            };

        default:
            return state;
    }

}