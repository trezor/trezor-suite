import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TradingHistoryDetailSlippageRow } from './TradingHistoryDetailSlippageRow';

describe('TradingHistoryDetailSlippageRow', () => {
    it('renders the maximum slippage', async () => {
        const { getByTestId, getByText } = await renderWithBasicProvider(
            <TradingHistoryDetailSlippageRow swapSlippage="1" />,
        );

        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.detail.info.maximumSlippage')),
        ).toBeOnTheScreen();
        expect(getByText('1%')).toBeOnTheScreen();
        expect(
            getByTestId('@trading/history/detail/info/slippage-explanation/button'),
        ).toBeOnTheScreen();
    });

    it.each([
        ['0.5', '0.5%'],
        ['0.25', '0.25%'],
        ['0.125', '0.13%'],
        ['1.23456', '1.23%'],
    ])('renders slippage %s as %s', async (swapSlippage, expected) => {
        const { getByText } = await renderWithBasicProvider(
            <TradingHistoryDetailSlippageRow swapSlippage={swapSlippage} />,
        );

        expect(getByText(expected)).toBeOnTheScreen();
    });
});
