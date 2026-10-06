import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, userEvent } from '@suite-native/test-utils';

import { TradingHistoryDetailTradeIdRow } from './TradingHistoryDetailTradeIdRow';

const mockCopyToClipboard = jest.fn(() => Promise.resolve());

jest.mock('@suite-native/clipboard', () => ({
    useCopyToClipboard: () => mockCopyToClipboard,
}));

describe('TradingHistoryDetailTradeIdRow', () => {
    beforeEach(() => {
        mockCopyToClipboard.mockClear();
    });

    it('renders and copies the trade ID', async () => {
        const orderId = 'trade-order-id';
        const { getByTestId, getByText } = await renderWithBasicProvider(
            <TradingHistoryDetailTradeIdRow orderId={orderId} />,
        );

        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.detail.info.tradeId')),
        ).toBeOnTheScreen();
        expect(getByText(orderId)).toBeOnTheScreen();

        await userEvent.press(getByTestId('@trading/history/detail/info/trade-id'));

        expect(mockCopyToClipboard).toHaveBeenCalledWith(
            orderId,
            getTranslation('generic.savedToClipboard'),
        );
    });
});
