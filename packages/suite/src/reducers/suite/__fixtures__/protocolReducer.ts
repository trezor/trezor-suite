import { PROTOCOL } from '@suite-actions/constants';

const initialState = {
    sendForm: {},
};

const protocol = {
    address: 'bc1q00h58c5vzcyqavwpjvw8tl8r53t9d57e6smwqe',
    amount: 0.001,
    scheme: 'bitcoin',
};

export default [
    {
        description: 'Should fill send form',
        initialState: {
            sendForm: {
                ...protocol,
                shouldFillSendForm: false,
            },
        },
        actions: [
            {
                type: PROTOCOL.FILL_SEND_FORM,
                payload: true,
            },
        ],
        result: {
            sendForm: {
                ...protocol,
                shouldFillSendForm: true,
            },
        },
    },
    {
        description: 'Send form filled',
        initialState: {
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
            sendForm: {
                ...protocol,
                shouldFillSendForm: false,
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
            sendForm: {
                ...protocol,
                shouldFillSendForm: false,
            },
        },
    },
    {
        description: 'Protocol state reset',
        initialState: {
            sendForm: {
                ...protocol,
                shouldFillSendForm: false,
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
