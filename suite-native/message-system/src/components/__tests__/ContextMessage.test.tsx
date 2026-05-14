import { Context, type ContextDomain } from '@suite-common/message-system';
import { type Action, type Message } from '@suite-common/suite-types';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { ContextMessage } from '../ContextMessage';

const contextActionId = 'ContextActionId_1';
const contentText = 'Content Text';
const contentTextCs = 'Content Text Cs';
const tradingContextMsg = {
    id: contextActionId,
    priority: 1,
    dismissible: true,
    variant: 'info',
    category: ['context'],
    content: {
        en: contentText,
        es: contentText,
        cs: contentTextCs,
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

jest.mock('@suite-common/message-system', () => ({
    ...jest.requireActual('@suite-common/message-system'),
    initMessageSystemThunk: () => {},
}));

describe('ContextMessage', () => {
    const emptyMessageSystem = {
        config: { actions: [] },
        validMessages: { banner: [], context: [], modal: [], feature: [] },
        dismissedMessages: [],
    };

    const render = ({
        context,
        preloadedState,
    }: {
        context: ContextDomain;
        preloadedState?: any;
    }) =>
        renderWithStoreProvider(
            <ContextMessage context={context} accessibilityHint={contextActionId} />,
            {
                preloadedState: { messageSystem: emptyMessageSystem, ...preloadedState },
            },
        );

    it('should render content when there is message of given context', () => {
        const { queryByText } = render({
            context: Context.getTrading('buy'),
            preloadedState: stateWithTradeContextMessage,
        });
        expect(queryByText(contentText)).toBeTruthy();
    });

    it('should return null when there is no message fetched', () => {
        const { queryByHintText } = render({
            context: Context.getTrading('buy'),
        });
        expect(queryByHintText(contextActionId)).toBeNull();
    });

    it('should render content in English when locale is en-US', () => {
        const { queryByText } = render({
            context: Context.getTrading('buy'),
            preloadedState: {
                ...stateWithTradeContextMessage,
                locale: {
                    appLocaleCode: 'en-US',
                    systemLocaleCode: 'en-US',
                },
            },
        });
        expect(queryByText(contentText)).toBeTruthy();
        expect(queryByText(contentTextCs)).toBeNull();
    });

    it('should render content in Czech when locale is cs-CZ - different from en-US', () => {
        const { queryByText } = render({
            context: Context.getTrading('buy'),
            preloadedState: {
                ...stateWithTradeContextMessage,
                locale: {
                    appLocaleCode: 'cs-CZ',
                    systemLocaleCode: 'cs-CZ',
                },
            },
        });
        expect(queryByText(contentTextCs)).toBeTruthy();
        expect(queryByText(contentText)).toBeNull();
    });
});
