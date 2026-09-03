import type { ExchangeTrade } from 'invity-api';

import { getTranslation } from '@suite-native/intl';
import { mercuryoDexQuote } from '@suite-native/trading-fixtures';

import { ExchangeSlippagePicker } from './ExchangeSlippagePicker';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

describe('ExchangeSlippagePicker', () => {
    const renderExchangeSlippagePicker = async (quote: ExchangeTrade | undefined) =>
        await renderWithTradingProvider(
            <ExchangeSlippagePicker quote={quote} onSlippageConfirmed={jest.fn()} />,
            {
                tradeType: 'exchange',
                overrides: {
                    wallet: {
                        trading: {
                            exchange: {
                                selectedQuote: quote,
                            },
                        },
                    },
                },
            },
        );

    it('should render null when receive amount is undefined', async () => {
        const { toJSON } = await renderExchangeSlippagePicker(undefined);

        expect(toJSON()).toBeNull();
    });

    it('should render SlippagePicker when receive amount is defined', async () => {
        const { getByText } = await renderExchangeSlippagePicker(mercuryoDexQuote);

        expect(
            getByText(getTranslation('moduleTrading.slippage.maxSlippageLabel')),
        ).toBeOnTheScreen();
    });
});
