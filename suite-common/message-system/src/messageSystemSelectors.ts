import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { Message, Category } from '@suite-common/suite-types';

import { ContextDomain, FeatureDomain, MessageSystemRootState } from './messageSystemTypes';

// Create app-specific selectors with correct types
const createMemoizedSelector = createWeakMapSelector.withTypes<MessageSystemRootState>();

// Basic selectors don't need memoization
export const selectMessageSystemConfig = (state: MessageSystemRootState) =>
    state.messageSystem.config;

export const selectMessageSystemTimestamp = (state: MessageSystemRootState) =>
    state.messageSystem.timestamp;

export const selectMessageSystemCurrentSequence = (state: MessageSystemRootState) =>
    state.messageSystem.currentSequence;

const comparePriority = (a: Message, b: Message) => b.priority - a.priority;

const makeSelectActiveMessagesByCategory = (category: Category) =>
    createMemoizedSelector(
        [
            state => state.messageSystem.config,
            state => state.messageSystem.validMessages[category],
            state => state.messageSystem.dismissedMessages,
        ],
        (config, validMessages, dismissedMessages) => {
            const nonDismissedValidMessages = validMessages.filter(
                id => !dismissedMessages[id]?.[category],
            );

            const messages = config?.actions
                .filter(({ message }) => nonDismissedValidMessages.includes(message.id))
                .map(action => action.message);

            return returnStableArrayIfEmpty(messages?.sort(comparePriority));
        },
    );

export const selectActiveBannerMessages = makeSelectActiveMessagesByCategory('banner');
export const selectActiveContextMessages = makeSelectActiveMessagesByCategory('context');
export const selectActiveModalMessages = makeSelectActiveMessagesByCategory('modal');
export const selectActiveFeatureMessages = makeSelectActiveMessagesByCategory('feature');

export const selectIsAnyBannerMessageActive = createMemoizedSelector(
    [selectActiveBannerMessages],
    activeBannerMessages => activeBannerMessages.length > 0,
);

export const selectBannerMessage = createMemoizedSelector(
    [selectActiveBannerMessages],
    activeBannerMessages => activeBannerMessages[0],
);

export const selectContextMessage = createMemoizedSelector(
    [selectActiveContextMessages, (_state, domain: ContextDomain) => domain],
    (activeContextMessages, domain) =>
        activeContextMessages.find(message => message.context?.domain === domain),
);

export const selectContextMessageContent = createMemoizedSelector(
    [
        selectActiveContextMessages,
        (_state, domain: ContextDomain) => domain,
        (_state, _domain, language: string) => language,
    ],
    (activeContextMessages, domain, language) => {
        const message = activeContextMessages.find(
            activeContextMessage => activeContextMessage.context?.domain === domain,
        );
        if (!message) return undefined;

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

export const selectFeatureMessage = createMemoizedSelector(
    [selectActiveFeatureMessages, (_state, domain: FeatureDomain) => domain],
    (activeFeatureMessages, domain) =>
        activeFeatureMessages.find(message =>
            message.feature?.some(feature => feature.domain === domain),
        ),
);

export const selectFeatureMessageContent = createMemoizedSelector(
    [
        selectFeatureMessage,
        (_state, domain: FeatureDomain) => domain,
        (_state, _domain, language: string) => language,
    ],
    (featureMessages, _domain, language) =>
        featureMessages?.content[language] ?? featureMessages?.content.en,
);

export const selectFeatureConfig = createMemoizedSelector(
    [selectFeatureMessage, (_state, domain: FeatureDomain) => domain],
    (featureMessages, domain) =>
        featureMessages?.feature?.find(feature => feature.domain === domain),
);

// These don't need memoization as they're simple computations
export const selectIsFeatureEnabled = (
    state: MessageSystemRootState,
    domain: FeatureDomain,
    defaultValue?: boolean,
) => {
    const featureFlag = selectFeatureConfig(state, domain)?.flag;

    return featureFlag ?? defaultValue ?? true;
};

export const selectIsFeatureDisabled = (
    state: MessageSystemRootState,
    domain: FeatureDomain,
    defaultValue?: boolean,
) => {
    const featureFlag = selectFeatureConfig(state, domain)?.flag;

    return typeof featureFlag === 'boolean' ? !featureFlag : defaultValue ?? false;
};

const selectValidMessages = (state: MessageSystemRootState) => state.messageSystem.validMessages;
const selectConfig = (state: MessageSystemRootState) => state.messageSystem.config;

export const selectAllValidMessages = createMemoizedSelector(
    [selectValidMessages, selectConfig],
    (validMessages, config) => {
        const allValidMessages = [
            ...validMessages.banner,
            ...validMessages.feature,
            ...validMessages.modal,
            ...validMessages.context,
        ];

        return returnStableArrayIfEmpty(
            config?.actions.map(a => a.message).filter(m => allValidMessages.includes(m.id)),
        );
    },
);
