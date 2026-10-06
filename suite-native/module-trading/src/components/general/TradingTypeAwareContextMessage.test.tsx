import { type TradingType } from '@suite-common/trading';

import { TradingTypeAwareContextMessage } from './TradingTypeAwareContextMessage';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

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

    const renderTradingTypeAwareContextMessage = async (
        overrides: PreloadedStatePartial<TradingTestPreloadedState>,
    ) => await renderWithTradingProvider(<TradingTypeAwareContextMessage />, { overrides });

    it.each<[TradingType, string]>([
        ['buy', 'Trading buy message'],
        ['exchange', 'Trading exchange message'],
        ['sell', 'Trading sell message'],
    ])(
        'should render correct context message for trading type %s',
        async (tradingType, expectedMessage) => {
            const { getByText } = await renderTradingTypeAwareContextMessage(
                overridesForTradingType(tradingType),
            );

            expect(getByText(expectedMessage)).toBeOnTheScreen();
        },
    );

    it('should render nothing when trading type is not specified', async () => {
        const { toJSON } = await renderTradingTypeAwareContextMessage(
            overridesForTradingType(undefined),
        );

        expect(toJSON()).toBeNull();
    });
});
