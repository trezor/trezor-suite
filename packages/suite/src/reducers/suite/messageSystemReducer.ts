import produce from 'immer';
import { memoize, memoizeWithArgs } from 'proxy-memoize';

import { Action } from '@suite-types';
import { MESSAGE_SYSTEM, STORAGE } from '@suite-actions/constants';
import { selectLanguage, SuiteRootState } from './suiteReducer';

import { Message, MessageSystem, Category } from '@trezor/message-system';

export type MessageSystemRootState = {
    messageSystem: MessageSystemState;
} & SuiteRootState;

export type MessageState = { [key in Category]: boolean };

export const Feature = {
    coinjoin: 'coinjoin',
} as const;

type FeatureDomain = (typeof Feature)[keyof typeof Feature];

export const Context = {
    coinjoin: 'accounts.coinjoin',
} as const;

type ContextDomain = (typeof Context)[keyof typeof Context];

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
    memoize((state: MessageSystemRootState) => {
        const { config, validMessages, dismissedMessages } = state.messageSystem;
        const nonDismissedValidMessages = validMessages[category].filter(
            id => !dismissedMessages[id]?.[category],
        );

        const messages = config?.actions
            .filter(({ message }) => nonDismissedValidMessages.includes(message.id))
            .map(action => action.message);

        if (!messages?.length) return [];

        return messages.sort(comparePriority);
    });

export const selectActiveBannerMessages = makeSelectActiveMessagesByCategory('banner');
export const selectActiveContextMessages = makeSelectActiveMessagesByCategory('context');
export const selectActiveModalMessages = makeSelectActiveMessagesByCategory('modal');
export const selectActiveFeatureMessages = makeSelectActiveMessagesByCategory('feature');

export const selectBannerMessage = memoize((state: MessageSystemRootState) => {
    const activeBannerMessages = selectActiveBannerMessages(state);
    return activeBannerMessages[0];
});

export const selectContextMessage = memoizeWithArgs(
    (state: MessageSystemRootState, domain: ContextDomain) => {
        const activeContextMessages = selectActiveContextMessages(state);
        return activeContextMessages.find(message => message.context?.domain === domain);
    },
);

export const selectContextMessageContent = memoizeWithArgs(
    (state: MessageSystemRootState, domain: ContextDomain) => {
        const activeContextMessages = selectActiveContextMessages(state);
        const language = selectLanguage(state);
        const message = activeContextMessages.find(message => message.context?.domain === domain);
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

export const selectFeatureMessage = memoizeWithArgs(
    (state: MessageSystemRootState, domain: FeatureDomain) => {
        const activeFeatureMessages = selectActiveFeatureMessages(state);
        return activeFeatureMessages.find(message =>
            message.feature?.some(feature => feature.domain === domain),
        );
    },
);

export const selectFeatureMessageContent = memoizeWithArgs(
    (state: MessageSystemRootState, domain: FeatureDomain) => {
        const featureMessages = selectFeatureMessage(state, domain);
        const language = selectLanguage(state);
        return featureMessages?.content[language] ?? featureMessages?.content.en;
    },
);

export const selectFeatureFlag = memoizeWithArgs(
    (state: MessageSystemRootState, domain: FeatureDomain) => {
        const featureMessages = selectFeatureMessage(state, domain);
        return featureMessages?.feature?.find(feature => feature.domain === domain)?.flag;
    },
);

export const selectIsFeatureEnabled = memoizeWithArgs(
    (state: MessageSystemRootState, domain: FeatureDomain, defaultValue?: boolean) => {
        const featureFlag = selectFeatureFlag(state, domain);
        return featureFlag ?? defaultValue ?? true;
    },
);

export const selectIsFeatureDisabled = memoizeWithArgs(
    (state: MessageSystemRootState, domain: FeatureDomain, defaultValue?: boolean) => {
        const featureFlag = selectFeatureFlag(state, domain);
        return typeof featureFlag === 'boolean' ? !featureFlag : defaultValue ?? false;
    },
);

export default messageSystemReducer;
