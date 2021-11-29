import { PROTOCOL } from '@suite-actions/constants';
import { initialState } from '@suite-reducers/protocolReducer';

const protocol = {
    address: 'bc1q00h58c5vzcyqavwpjvw8tl8r53t9d57e6smwqe',
    amount: 0.001,
    scheme: 'bitcoin',
};

export default [
    {
        description: 'Should fill send form',
        initialState: {
            ...initialState,
            sendForm: {
                ...protocol,
                shouldFill: false,
            },
        },
        actions: [
            {
                type: PROTOCOL.FILL_SEND_FORM,
                payload: true,
            },
        ],
        result: {
            ...initialState,
            sendForm: {
                ...protocol,
                shouldFill: true,
            },
        },
    },
    {
        description: 'Send form filled',
        initialState: {
            ...initialState,
            sendForm: {
                ...protocol,
            },
        },
        actions: [
            {
                type: PROTOCOL.FILL_SEND_FORM,
                payload: false,
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
