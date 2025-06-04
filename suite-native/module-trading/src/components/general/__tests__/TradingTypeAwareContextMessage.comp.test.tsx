import { TradingType } from '@suite-common/trading';
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { TradingTypeAwareContextMessage } from '../TradingTypeAwareContextMessage';

jest.mock('@suite-common/message-system', () => {
    const messages: Record<string, unknown> = {
        'trading.buy': {
            content: { en: 'Trading buy message' },
        },
        'trading.exchange': {
            content: { en: 'Trading exchange message' },
        },
        'trading.sell': {
            content: { en: 'Trading sell message' },
        },
    };

    return {
        ...jest.requireActual('@suite-common/message-system'),
        selectContextMessage: (_: unknown, context: string) => messages[context],
    };
});

describe('TradingTypeAwareContextMessage', () => {
    const getPreloadedState = (activeTradingType: TradingType | undefined): PreloadedState => ({
        wallet: {
            tradingNew: {
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
