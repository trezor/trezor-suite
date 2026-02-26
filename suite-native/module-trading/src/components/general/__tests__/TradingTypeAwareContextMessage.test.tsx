import { TradingType } from '@suite-common/trading';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';

import { TradingTypeAwareContextMessage } from '../TradingTypeAwareContextMessage';

jest.mock('@suite-common/message-system', () => {
    const messages: Record<string, unknown> = {
        'trading.buy': {
            content: 'Trading buy message',
        },
        'trading.exchange': {
            content: 'Trading exchange message',
        },
        'trading.sell': {
            content: 'Trading sell message',
        },
    };

    return {
        ...jest.requireActual('@suite-common/message-system'),
        selectContextMessageContent: (_: unknown, context: string) => messages[context],
    };
});

describe('TradingTypeAwareContextMessage', () => {
    const getPreloadedState = (activeTradingType: TradingType | undefined): PreloadedState => ({
        wallet: {
            trading: {
                activeTradingType,
            },
        },
    });

    const renderTradingTypeAwareContextMessage = (preloadedState: PreloadedState) =>
        renderWithStoreProviderAsync(<TradingTypeAwareContextMessage />, { preloadedState });

    it.each<[TradingType, string]>([
        ['buy', 'Trading buy message'],
        ['exchange', 'Trading exchange message'],
        ['sell', 'Trading sell message'],
    ])(
        'should render correct context message for trading type %s',
        async (tradingType, expectedMessage) => {
            const { getByText } = await renderTradingTypeAwareContextMessage(
                getPreloadedState(tradingType),
            );

            expect(getByText(expectedMessage)).toBeOnTheScreen();
        },
    );

    it('should render nothing when trading type is not specified', async () => {
        const { toJSON } = await renderTradingTypeAwareContextMessage(getPreloadedState(undefined));

        expect(toJSON()).toBeNull();
    });
});
