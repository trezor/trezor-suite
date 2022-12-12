import { useMemo, useCallback } from 'react';
import { useSelector } from './useSelector';
import { Message, Category } from '@trezor/message-system';
import { State as MessageSystemState } from '@suite-reducers/messageSystemReducer';

export const Feature = {
    coinjoin: 'coinjoin',
} as const;

export type Feature = typeof Feature[keyof typeof Feature];

export const Context = {
    coinjoin: 'accounts.coinjoin',
} as const;

export type Context = typeof Context[keyof typeof Context];

const comparePriority = (a: Message, b: Message) => b.priority - a.priority;

const messageCategories: Category[] = ['banner', 'context', 'modal', 'feature'];

const getActiveMessages = ({
    category,
    config,
    validMessages,
    dismissedMessages,
}: { category: Category } & Pick<
    MessageSystemState,
    'config' | 'validMessages' | 'dismissedMessages'
>) => {
    const nonDismissedValidMessages = validMessages[category].filter(
        id => !dismissedMessages[id]?.[category],
    );

    const messages = config?.actions
        .filter(({ message }) => nonDismissedValidMessages.includes(message.id))
        .map(action => action.message);

    if (!messages?.length) return [];

    return messages.sort(comparePriority);
};

export const useMessageSystem = () => {
    const config = useSelector(state => state.messageSystem.config);
    const validMessages = useSelector(state => state.messageSystem.validMessages);
    const dismissedMessages = useSelector(state => state.messageSystem.dismissedMessages);
    const language = useSelector(state => state.suite.settings.language);

    const messages = useMemo(
        () =>
            messageCategories.reduce<{ [key in Category]: Message[] }>(
                (messages, category) => ({
                    ...messages,
                    [category]: getActiveMessages({
                        category,
                        config,
                        validMessages,
                        dismissedMessages,
                    }),
                }),
                {
                    banner: [],
                    context: [],
                    modal: [],
                    feature: [],
                },
            ),
        [config, validMessages, dismissedMessages],
    );

    // TODO:  and modal messages

    const getContextMessage = useCallback(
        (domain: Context) => messages.context.find(message => message.context?.domain === domain),
        [messages],
    );

    const getFeatureMessage = useCallback(
        (domain: Feature) =>
            messages.feature.find(message =>
                message.feature?.some(feature => feature.domain === domain),
            ),
        [messages],
    );

    const getFeatureMessageContent = useCallback(
        (domain: Feature) => getFeatureMessage(domain)?.content[language || 'en'],
        [getFeatureMessage, language],
    );

    const isFeatureEnabled = useCallback(
        (domain: Feature, defaultValue = true) =>
            getFeatureMessage(domain)?.feature?.find(feature => feature.domain === domain)?.flag ??
            defaultValue,
        [getFeatureMessage],
    );

    return {
        bannerMessage: messages.banner[0],
        getContextMessage,
        getFeatureMessage,
        getFeatureMessageContent,
        isFeatureEnabled,
    };
};
