import { Context, ContextDomain } from '@suite-common/message-system';
import { Action, Message } from '@suite-common/suite-types';
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { ContextMessage } from '../ContextMessage';

const contextActionId = 'ContextActionId_1';
const contentText = 'Content Text';
const tradingContextMsg = {
    id: contextActionId,
    priority: 1,
    dismissible: true,
    variant: 'info',
    category: ['context'],
    content: {
        'en-GB': contentText,
        en: contentText,
        es: contentText,
        cs: contentText,
        ru: contentText,
        ja: contentText,
        hu: contentText,
        it: contentText,
        fr: contentText,
        de: contentText,
        tr: contentText,
        pt: contentText,
        uk: contentText,
    },
    context: {
        domain: 'trading.buy',
    },
} as Message;

const stateWithTradeContextMessage = {
    messageSystem: {
        config: {
            version: 1,
            timestamp: '2023-01-01',
            sequence: 1,
            actions: [{ message: tradingContextMsg } as Action],
            experiments: [],
        },
        currentSequence: 1,
        timestamp: 0,
        validMessages: {
            banner: [],
            context: [tradingContextMsg.id],
            modal: [],
            feature: [],
        },
        dismissedMessages: {},
        validExperiments: [],
    },
};

describe('ContextMessage', () => {
    const render = ({
        context,
        preloadedState,
    }: {
        context: ContextDomain;
        preloadedState?: PreloadedState;
    }) =>
        renderWithStoreProviderAsync(
            <ContextMessage context={context} accessibilityHint={contextActionId} />,
            {
                preloadedState,
            },
        );

    it('should return null when there is no message fetched', async () => {
        const { queryByHintText } = await render({
            context: Context.tradingBuy,
        });
        expect(queryByHintText(contextActionId)).toBeNull();
    });

    it('should return null when there is message of different context', async () => {
        const { queryByHintText } = await render({
            context: Context.coinjoin,
            preloadedState: stateWithTradeContextMessage,
        });
        expect(queryByHintText(contextActionId)).toBeNull();
    });

    it('should render content when there is message of given context', async () => {
        const { queryByText } = await render({
            context: Context.tradingBuy,
            preloadedState: stateWithTradeContextMessage,
        });
        expect(queryByText(contentText)).toBeDefined();
    });
});
