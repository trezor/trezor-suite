import { MESSAGE_SYSTEM, STORAGE } from '@suite-actions/constants';

export const timestamp = 10000000000;

const config = {
    version: 1,
    timestamp: '2021-03-03T03:48:16+00:00',
    sequence: 1,
    actions: [],
};
const messageIds = ['22e6444d-a586-4593-bc8d-5d013f193eba', '469c65a8-8632-11eb-8dcd-0242ac130003'];
const initialState = {
    config,
    currentSequence: config.sequence,
    timestamp: 0,

    validMessages: {
        banner: [],
        context: [],
        modal: [],
    },
    dismissedMessages: {},
};

export default [
    {
        description: 'Config successfully fetched',
        initialState,
        actions: [
            {
                type: MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS,
            },
        ],
        result: { ...initialState, timestamp },
    },
    {
        description: 'Remote config successfully fetched and stored',
        initialState,
        actions: [
            {
                type: MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS_UPDATE,
                payload: config,
                isRemote: true,
            },
        ],
        result: {
            ...initialState,
            timestamp,
            currentSequence: config.sequence,
            config,
        },
    },
    {
        description: 'Local config successfully fetched and stored',
        initialState,
        actions: [
            {
                type: MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS_UPDATE,
                payload: config,
                isRemote: false,
            },
        ],
        result: {
            ...initialState,
            timestamp: 0,
            currentSequence: config.sequence,
            config,
        },
    },
    {
        description: 'Config fetch error',
        initialState,
        actions: [
            {
                type: MESSAGE_SYSTEM.FETCH_CONFIG_ERROR,
            },
        ],
        result: {
            ...initialState,
            timestamp: 0,
        },
    },
    {
        description: 'Storage loaded',
        initialState,
        actions: [
            {
                type: STORAGE.LOADED,
                payload: {
                    messageSystem: {
                        ...initialState,
                        config,
                    },
                },
            },
        ],
        result: { ...initialState, config },
    },
    {
        description: 'Save valid messages',
        initialState,
        actions: [
            {
                type: MESSAGE_SYSTEM.SAVE_VALID_MESSAGES,
                category: 'banner',
                payload: messageIds,
            },
        ],
        result: {
            ...initialState,
            validMessages: {
                ...initialState.validMessages,
                banner: messageIds,
            },
        },
    },
    {
        description: 'Dismiss message',
        initialState,
        actions: [
            {
                type: MESSAGE_SYSTEM.DISMISS_MESSAGE,
                category: 'banner',
                id: messageIds[0],
            },
            {
                type: MESSAGE_SYSTEM.DISMISS_MESSAGE,
                category: 'context',
                id: messageIds[1],
            },
            {
                type: MESSAGE_SYSTEM.DISMISS_MESSAGE,
                category: 'modal',
                id: messageIds[0],
            },
        ],
        result: {
            ...initialState,
            dismissedMessages: {
                [messageIds[0]]: {
                    banner: true,
                    context: false,
                    modal: true,
                },
                [messageIds[1]]: {
                    banner: false,
                    context: true,
                    modal: false,
                },
            },
        },
    },
    {
        description: 'Default',
        initialState,
        actions: [
            {
                type: 'foo',
            },
        ],
        result: initialState,
    },
];
