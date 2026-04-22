import { type TradingType } from '@suite-common/trading';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';
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
    const overridesForTradingType = (
        activeTradingType: TradingType | undefined,
    ): PreloadedStatePartial<TradingTestPreloadedState> => ({
        wallet: {
            trading: {
                activeTradingType,
            },
        },
    });

    const renderTradingTypeAwareContextMessage = (
        overrides: PreloadedStatePartial<TradingTestPreloadedState>,
    ) => renderWithTradingProvider(<TradingTypeAwareContextMessage />, { overrides });

    it.each<[TradingType, string]>([
        ['buy', 'Trading buy message'],
        ['exchange', 'Trading exchange message'],
        ['sell', 'Trading sell message'],
    ])(
        'should render correct context message for trading type %s',
        (tradingType, expectedMessage) => {
            const { getByText } = renderTradingTypeAwareContextMessage(
                overridesForTradingType(tradingType),
            );

            expect(getByText(expectedMessage)).toBeOnTheScreen();
        },
    );

    it('should render nothing when trading type is not specified', () => {
        const { toJSON } = renderTradingTypeAwareContextMessage(overridesForTradingType(undefined));

        expect(toJSON()).toBeNull();
    });
});
