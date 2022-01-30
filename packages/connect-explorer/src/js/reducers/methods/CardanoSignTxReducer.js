/* @flow */

import { LOCATION_CHANGE } from 'connected-react-router';
import { NETWORK_CHANGE, INPUTS_CHANGE, OUTPUTS_CHANGE, TXS_CHANGE } from '../../actions/methods/CardanoSignTxActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    network: number;
    inputs: string;
    outputs: number;
    transactions: string;
}

const defaultInputs: string = 
`[
    {
        path: "m/44'/1815'/0'/0/0",
        prev_hash: "2effff328b76a8113e32a218f7af99e77768289c9201e8d26a9cda0edaf59bfd",
        prev_index: 0,
        type: 0
    }
]`;

const defaultOutputs: string = 
`[
    {
        address: "2w1sdSJu3GVeNrv8NVHmWNBqK6ssW84An4pExajjdFgXx6k4gksoo6CP1qTwbE34qjKEHZtUKGxY1GMkApUnNEMwGPTgLc7Yghs",
        amount: "1000000"
    },
    {
        path: "m/44'/1815'/0'/0/1",
        amount: "7120787"
    }
]`;

const defaultTxs: string = 
`[
    "839f8200d81858248258208f088493a600c7d897ef89caeb060e8e8137a1e5aa52e32f6262ec5a087341a6008200d81858248258208f088493a600c7d897ef89caeb060e8e8137a1e5aa52e32f6262ec5a087341a601ff9f8282d818583e83581c3a043fc1baa52fe4df2be89c689c953a52e7c13e51551ef5a3ed1e3da101581a5818360a746c532b81f364ce25168befa6cb2e29d5eccc4883bc001a90ce7a581a007e86118282d818584283581cc52ea4de5aacc58e0fab8b1a55e8bc194c6fd22eebd93fab56cf2789a101581e581c8c44aea4dee0952907690336fa16773c53257ec002dbd219d3970747001a409c205e01ffa0",
    "839f8200d81858248258208f088493a600c7d897ef89caeb060e8e8137a1e5aa52e32f6262ec5a087341a6008200d81858248258208f088493a600c7d897ef89caeb060e8e8137a1e5aa52e32f6262ec5a087341a601ff9f8282d818583e83581c3a043fc1baa52fe4df2be89c689c953a52e7c13e51551ef5a3ed1e3da101581a5818360a746c532b81f364ce25168befa6cb2e29d5eccc4883bc001a90ce7a581a007e86118282d818584283581cc52ea4de5aacc58e0fab8b1a55e8bc194c6fd22eebd93fab56cf2789a101581e581c8c44aea4dee0952907690336fa16773c53257ec002dbd219d3970747001a409c205e01ffa0",
    "839f8200d81858248258208f088493a600c7d897ef89caeb060e8e8137a1e5aa52e32f6262ec5a087341a6008200d81858248258208f088493a600c7d897ef89caeb060e8e8137a1e5aa52e32f6262ec5a087341a601ff9f8282d818583e83581c3a043fc1baa52fe4df2be89c689c953a52e7c13e51551ef5a3ed1e3da101581a5818360a746c532b81f364ce25168befa6cb2e29d5eccc4883bc001a90ce7a581a007e86118282d818584283581cc52ea4de5aacc58e0fab8b1a55e8bc194c6fd22eebd93fab56cf2789a101581e581c8c44aea4dee0952907690336fa16773c53257ec002dbd219d3970747001a409c205e01ffa0",
    "839f8200d81858248258208f088493a600c7d897ef89caeb060e8e8137a1e5aa52e32f6262ec5a087341a6008200d81858248258208f088493a600c7d897ef89caeb060e8e8137a1e5aa52e32f6262ec5a087341a601ff9f8282d818583e83581c3a043fc1baa52fe4df2be89c689c953a52e7c13e51551ef5a3ed1e3da101581a5818360a746c532b81f364ce25168befa6cb2e29d5eccc4883bc001a90ce7a581a007e86118282d818584283581cc52ea4de5aacc58e0fab8b1a55e8bc194c6fd22eebd93fab56cf2789a101581e581c8c44aea4dee0952907690336fa16773c53257ec002dbd219d3970747001a409c205e01ffa0",
    "839f8200d81858248258208f088493a600c7d897ef89caeb060e8e8137a1e5aa52e32f6262ec5a087341a6008200d81858248258208f088493a600c7d897ef89caeb060e8e8137a1e5aa52e32f6262ec5a087341a601ff9f8282d818583e83581c3a043fc1baa52fe4df2be89c689c953a52e7c13e51551ef5a3ed1e3da101581a5818360a746c532b81f364ce25168befa6cb2e29d5eccc4883bc001a90ce7a581a007e86118282d818584283581cc52ea4de5aacc58e0fab8b1a55e8bc194c6fd22eebd93fab56cf2789a101581e581c8c44aea4dee0952907690336fa16773c53257ec002dbd219d3970747001a409c205e01ffa0",
    "839f8200d81858248258208f088493a600c7d897ef89caeb060e8e8137a1e5aa52e32f6262ec5a087341a6008200d81858248258208f088493a600c7d897ef89caeb060e8e8137a1e5aa52e32f6262ec5a087341a601ff9f8282d818583e83581c3a043fc1baa52fe4df2be89c689c953a52e7c13e51551ef5a3ed1e3da101581a5818360a746c532b81f364ce25168befa6cb2e29d5eccc4883bc001a90ce7a581a007e86118282d818584283581cc52ea4de5aacc58e0fab8b1a55e8bc194c6fd22eebd93fab56cf2789a101581e581c8c44aea4dee0952907690336fa16773c53257ec002dbd219d3970747001a409c205e01ffa0",
    "839f8200d81858248258208f088493a600c7d897ef89caeb060e8e8137a1e5aa52e32f6262ec5a087341a6008200d81858248258208f088493a600c7d897ef89caeb060e8e8137a1e5aa52e32f6262ec5a087341a601ff9f8282d818583e83581c3a043fc1baa52fe4df2be89c689c953a52e7c13e51551ef5a3ed1e3da101581a5818360a746c532b81f364ce25168befa6cb2e29d5eccc4883bc001a90ce7a581a007e86118282d818584283581cc52ea4de5aacc58e0fab8b1a55e8bc194c6fd22eebd93fab56cf2789a101581e581c8c44aea4dee0952907690336fa16773c53257ec002dbd219d3970747001a409c205e01ffa0",
]`;

const initialState: MethodState = {
    js: 'TrezorConnect.cardanoSignTransaction',
    fields: ['network', 'inputs', 'outputs', 'transactions'],

    network: 1,
    inputs: defaultInputs,
    outputs: defaultOutputs,
    transactions: defaultTxs,
    
};

export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        case LOCATION_CHANGE :
            return initialState;

        case NETWORK_CHANGE :
            return {
                ...state,
                network: action.network
            };

        case INPUTS_CHANGE :
            return {
                ...state,
                inputs: action.inputs
            };

        case OUTPUTS_CHANGE :
            return {
                ...state,
                outputs: action.outputs
            };

        case TXS_CHANGE :
            return {
                ...state,
                transactions: action.transactions
            };

        default:
            return state;
    }
}