import { AnyAction } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { messageSystemActions } from './messageSystemActions';
import { MessageState, MessageSystemState } from './messageSystemTypes';

const initialState: MessageSystemState = {
    config: null,
    currentSequence: 0,
    timestamp: 0,

    validMessages: {
        banner: [],
        context: [],
        modal: [],
        feature: [],
    },
    dismissedMessages: {},

    validExperiments: [],

    configSource: 'remote',

    inAppIds: {},
};

export const messageSystemInitialState = initialState;

export const messageSystemPersistedWhitelist: Array<keyof MessageSystemState> = [
    'config',
    'currentSequence',
    'dismissedMessages',
];

const getMessageStateById = (draft: MessageSystemState, id: string): MessageState => {
    if (!draft.dismissedMessages[id]) {
        draft.dismissedMessages[id] = {
            banner: false,
            context: false,
            modal: false,
            feature: false,
        };
    }

    return draft.dismissedMessages[id];
};

export const prepareMessageSystemReducer = createReducerWithExtraDeps(
    initialState,
    (builder, extra) => {
        builder
            .addCase(messageSystemActions.fetchSuccess, (state, { payload }) => {
                const { timestamp } = payload;
                state.timestamp = timestamp;
            })
            .addCase(messageSystemActions.fetchSuccessUpdate, (state, { payload }) => {
                const { timestamp, config } = payload;

                state.timestamp = timestamp;
                state.currentSequence = config.sequence;

                const prevInAppActions =
                    state.config?.actions?.filter(a => !!state.inAppIds[a.message.id]) ?? [];
                const incomingFileActions = config.actions ?? [];

                state.config = {
                    ...config,
                    actions: [...prevInAppActions, ...incomingFileActions],
                };
            })
            .addCase(messageSystemActions.fetchError, state => {
                state.timestamp = 0;
            })
            .addCase(messageSystemActions.updateValidMessages, (state, { payload }) => {
                state.validMessages = payload;
            })
            .addCase(messageSystemActions.dismissMessage, (state, { payload }) => {
                const { id, category } = payload;
                const messageState = getMessageStateById(state, id);
                messageState[category] = true;
            })
            .addCase(messageSystemActions.updateValidExperiments, (state, { payload }) => {
                state.validExperiments = payload;
            })
            .addCase(messageSystemActions.setConfigSource, (state, { payload }) => {
                state.configSource = payload;
            })
            .addCase(messageSystemActions.addMessage, (state, { payload }) => {
                if (state.config) {
                    state.config.actions = [payload, ...state.config.actions];
                    state.inAppIds[payload.message.id] = true;
                }
            })
            .addCase(messageSystemActions.removeMessage, (state, { payload }) => {
                if (state.config) {
                    state.config.actions = state.config.actions.filter(
                        action => action.message.id !== payload,
                    );

                    if (state.inAppIds[payload]) {
                        delete state.inAppIds[payload];
                    }
                }
            })
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                (state, action: AnyAction) => ({
                    ...state,
                    ...action.payload.messageSystem,
                }),
            );
    },
);
