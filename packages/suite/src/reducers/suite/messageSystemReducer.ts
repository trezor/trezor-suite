import produce from 'immer';

import { Action } from '@suite-types';
import { MESSAGE_SYSTEM, STORAGE } from '@suite-actions/constants';
import { createSelector } from '@reduxjs/toolkit';
import { selectLanguage } from './suiteReducer';

import { Message, MessageSystem, Category } from '@trezor/message-system';

export type MessageSystemRootState = {
    messageSystem: MessageSystemState;
};

export type MessageState = { [key in Category]: boolean };

export const Feature = {
    coinjoin: 'coinjoin',
} as const;

type FeatureDomain = typeof Feature[keyof typeof Feature];

export const Context = {
    coinjoin: 'accounts.coinjoin',
} as const;

type ContextDomain = typeof Context[keyof typeof Context];

export type MessageSystemState = {
    config: MessageSystem | null;
    currentSequence: number;
    timestamp: number;
    validMessages: { [key in Category]: string[] };
    dismissedMessages: {
        [key: string]: MessageState;
    };
};

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
};

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

const messageSystemReducer = (
    state: MessageSystemState = initialState,
    action: Action,
): MessageSystemState =>
    produce(state, draft => {
        let messageState;

        switch (action.type) {
            case STORAGE.LOAD:
                return {
                    ...state,
                    ...action.payload.messageSystem,
                };
            case MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS:
                draft.timestamp = action.payload.timestamp;
                break;
            case MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS_UPDATE:
                draft.timestamp = action.payload.timestamp;
                draft.config = action.payload.config;
                draft.currentSequence = action.payload.config.sequence;
                break;
            case MESSAGE_SYSTEM.FETCH_CONFIG_ERROR:
                draft.timestamp = 0;
                break;
            case MESSAGE_SYSTEM.SAVE_VALID_MESSAGES:
                draft.validMessages = action.payload;
                break;
            case MESSAGE_SYSTEM.DISMISS_MESSAGE:
                messageState = getMessageStateById(draft, action.payload.id);
                messageState[action.payload.category] = true;
                break;
            default:
                break;
        }
    });

const comparePriority = (a: Message, b: Message) => b.priority - a.priority;

const makeSelectActiveMessagesByCategory = (category: Category) =>
    createSelector(
        (state: MessageSystemRootState) => state.messageSystem.config,
        (state: MessageSystemRootState) => state.messageSystem.validMessages,
        (state: MessageSystemRootState) => state.messageSystem.dismissedMessages,
        (config, validMessages, dismissedMessages) => {
            const nonDismissedValidMessages = validMessages[category].filter(
                id => !dismissedMessages[id]?.[category],
            );

            const messages = config?.actions
                .filter(({ message }) => nonDismissedValidMessages.includes(message.id))
                .map(action => action.message);

            if (!messages?.length) return [];

            return messages.sort(comparePriority);
        },
    );

export const selectActiveBannerMessages = makeSelectActiveMessagesByCategory('banner');
export const selectActiveContextMessages = makeSelectActiveMessagesByCategory('context');
export const selectActiveModalMessages = makeSelectActiveMessagesByCategory('modal');
export const selectActiveFeatureMessages = makeSelectActiveMessagesByCategory('feature');

export const selectBannerMessage = createSelector(
    selectActiveBannerMessages,
    messages => messages[0],
);

export const selectContextMessage = createSelector(
    selectActiveContextMessages,
    (_state: MessageSystemRootState, domain: ContextDomain) => domain,
    (messages, domain) => messages.find(message => message.context?.domain === domain),
);

export const selectContextMessageContent = createSelector(
    selectActiveContextMessages,
    (_state: MessageSystemRootState, domain: ContextDomain) => domain,
    selectLanguage,
    (messages, domain, language) => {
        const message = messages.find(message => message.context?.domain === domain);
        if (!message) return;
        return {
            ...message,
            content: message?.content[language] ?? message?.content.en,
            cta: message?.cta
                ? {
                      ...message.cta,
                      label: message.cta.label[language] ?? message.cta.label.en,
                  }
                : undefined,
        };
    },
);

export const selectFeatureMessage = createSelector(
    selectActiveFeatureMessages,
    (_state: MessageSystemRootState, domain: FeatureDomain) => domain,
    (messages, domain) =>
        messages.find(message => message.feature?.some(feature => feature.domain === domain)),
);

export const selectFeatureMessageContent = createSelector(
    selectFeatureMessage,
    selectLanguage,
    (message, language) => message?.content[language] ?? message?.content.en,
);

export const selectFeatureFlag = createSelector(
    selectFeatureMessage,
    (_state: MessageSystemRootState, domain: FeatureDomain) => domain,
    (message, domain) => message?.feature?.find(feature => feature.domain === domain)?.flag,
);

export const selectIsFeatureEnabled = createSelector(
    selectFeatureFlag,
    (_state: MessageSystemRootState, _domain: FeatureDomain, defaultValue?: boolean) =>
        defaultValue ?? true,
    (featureFlag, defaultValue) => featureFlag ?? defaultValue,
);

export const selectIsFeatureDisabled = createSelector(
    selectFeatureFlag,
    (_state: MessageSystemRootState, _domain: FeatureDomain, defaultValue?: boolean) =>
        defaultValue ?? false,
    (featureFlag, defaultValue) => (typeof featureFlag === 'boolean' ? !featureFlag : defaultValue),
);

export default messageSystemReducer;
