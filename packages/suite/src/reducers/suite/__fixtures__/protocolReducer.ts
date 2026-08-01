import { asProtocol } from '@trezor/network-module-suite-common-types';

import { PROTOCOL } from 'src/actions/suite/constants';
import { initialState } from 'src/reducers/suite/protocolReducer';

const protocol = {
    address: 'bc1q00h58c5vzcyqavwpjvw8tl8r53t9d57e6smwqe',
    amount: 0.001,
    scheme: asProtocol('bitcoin'),
};

export default [
    {
        description: 'Save coin protocol',
        initialState,
        actions: [
            {
                type: PROTOCOL.SAVE_COIN_PROTOCOL,
                payload: { ...protocol },
            },
        ],
        result: {
            ...initialState,
            sendForm: {
                ...protocol,
                shouldFill: false,
            },
        },
    },
    {
        description: 'Protocol state reset',
        initialState: {
            ...initialState,
            sendForm: {
                ...protocol,
                shouldFill: false,
            },
        },
        actions: [
            {
                type: PROTOCOL.RESET,
            },
        ],
        result: { ...initialState },
    },
];
