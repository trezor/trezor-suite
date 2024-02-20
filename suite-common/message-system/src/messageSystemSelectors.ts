import { memoize, memoizeWithArgs } from 'proxy-memoize';

import { Message, Category } from '@suite-common/suite-types';

import { ContextDomain, FeatureDomain, MessageSystemRootState } from './messageSystemTypes';

export const selectMessageSystemConfig = (state: MessageSystemRootState) =>
    state.messageSystem.config;

export const selectMessageSystemTimestamp = (state: MessageSystemRootState) =>
    state.messageSystem.timestamp;

export const selectMessageSystemCurrentSequence = (state: MessageSystemRootState) =>
    state.messageSystem.currentSequence;

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

export const selectIsAnyBannerMessageActive = (state: MessageSystemRootState) => {
    const activeBannerMessages = selectActiveBannerMessages(state);

    return activeBannerMessages.length > 0;
};

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
    (state: MessageSystemRootState, domain: ContextDomain, language: string) => {
        const activeContextMessages = selectActiveContextMessages(state);
        const message = activeContextMessages.find(
            activeContextMessage => activeContextMessage.context?.domain === domain,
        );
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
    (state: MessageSystemRootState, domain: FeatureDomain, language: string) => {
        const featureMessages = selectFeatureMessage(state, domain);

        return featureMessages?.content[language] ?? featureMessages?.content.en;
    },
);

export const selectFeatureConfig = memoizeWithArgs(
    (state: MessageSystemRootState, domain: FeatureDomain) => {
        const featureMessages = selectFeatureMessage(state, domain);

        return featureMessages?.feature?.find(feature => feature.domain === domain);
    },
);

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
