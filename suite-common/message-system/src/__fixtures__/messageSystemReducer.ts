import { extraDependenciesMock } from '@suite-common/test-utils';

import { messageSystemActions } from '../messageSystemActions';

export const timestamp = 10000000000;

const config = {
    version: 2,
    timestamp: '2021-03-03T03:48:16+00:00',
    sequence: 2,
    actions: [],
};
const messageIds = ['22e6444d-a586-4593-bc8d-5d013f193eba', '469c65a8-8632-11eb-8dcd-0242ac130003'];
const initialState = {
    config: {
        version: 1,
        timestamp: '2020-01-01T00:00:00+00:00',
        sequence: 1,
        actions: [],
    },
    currentSequence: 1,
    timestamp: 0,

    validMessages: {
        banner: [],
        context: [],
        modal: [],
        feature: [],
    },
    dismissedMessages: {},
};

export const fixtures = [
    {
        description: 'Config successfully fetched',
        initialState,
        actions: [
            {
                type: messageSystemActions.fetchSuccess.type,
                payload: { config, timestamp },
            },
        ],
        result: { ...initialState, timestamp },
    },
    {
        description: 'Remote config successfully fetched and stored',
        initialState,
        actions: [
            {
                type: messageSystemActions.fetchSuccessUpdate.type,
                payload: { config, timestamp },
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
                type: messageSystemActions.fetchSuccessUpdate.type,
                payload: { config, timestamp: 0 },
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
                type: messageSystemActions.fetchError.type,
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
                type: extraDependenciesMock.actionTypes.storageLoad,
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
                type: messageSystemActions.updateValidMessages.type,
                payload: { banner: messageIds, context: [], modal: [], feature: [] },
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
                type: messageSystemActions.dismissMessage.type,
                payload: { category: 'banner', id: messageIds[0] },
            },
            {
                type: messageSystemActions.dismissMessage.type,
                payload: { category: 'context', id: messageIds[1] },
            },
            {
                type: messageSystemActions.dismissMessage.type,
                payload: { category: 'modal', id: messageIds[0] },
            },
        ],
        result: {
            ...initialState,
            dismissedMessages: {
                [messageIds[0]]: {
                    banner: true,
                    context: false,
                    modal: true,
                    feature: false,
                },
                [messageIds[1]]: {
                    banner: false,
                    context: true,
                    modal: false,
                    feature: false,
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
