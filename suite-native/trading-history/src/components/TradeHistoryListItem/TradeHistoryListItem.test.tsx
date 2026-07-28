import { type TradingTransaction } from '@suite-common/trading';
import { fireEvent } from '@suite-native/test-utils-store';
import { getBuyTrade, getExchangeTrade, getSellTrade } from '@suite-native/trading-fixtures';

import { TradeHistoryListItem } from './TradeHistoryListItem';
import { renderWithTradingHistoryProvider } from '../../__tests__/tradingHistoryTestUtils';

jest.mock('@suite-native/trading-atoms', () => {
    const actualImplementation = jest.requireActual('@suite-native/trading-atoms');
    const { View } = jest.requireActual('react-native');

    return {
        ...actualImplementation,
        IconByCryptoId: ({ cryptoId }: { cryptoId: string }) => (
            <View accessibilityLabel={cryptoId} />
        ),
    };
});

describe('TradeHistoryListItem', () => {
    const renderTradeHistoryListItem = (transaction: TradingTransaction) =>
        renderWithTradingHistoryProvider(
            <TradeHistoryListItem transaction={transaction} onPress={jest.fn()} />,
        );

    it('should render a buy trade with fiat and crypto icons', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { getByLabelText, getByText, queryByText } = renderTradeHistoryListItem(buyTrade);

        expect(getByLabelText('flag-US')).toBeTruthy();
        expect(getByLabelText('ethereum')).toBeTruthy();
        expect(getByText('$1,234.00')).toBeTruthy();
        expect(getByText('0.462586 ETH')).toBeTruthy();
        expect(queryByText('Mercuryo')).toBeNull();
        expect(queryByText(/d3ef3451/)).toBeNull();
    });

    it('should render exchange and sell trade directions', () => {
        const exchangeTrade = getExchangeTrade({ status: 'SUCCESS' });
        const sellTrade = getSellTrade({ status: 'ERROR' });

        const exchangeResult = renderTradeHistoryListItem(exchangeTrade);

        expect(exchangeResult.getByText('10.1232 JTO')).toBeTruthy();
        expect(exchangeResult.getByText('0.462586 SOL')).toBeTruthy();
        exchangeResult.unmount();

        const sellResult = renderTradeHistoryListItem(sellTrade);

        expect(sellResult.getByText('1.22 BTC')).toBeTruthy();
        expect(sellResult.getByText('$100.00')).toBeTruthy();
        expect(sellResult.getByLabelText('flag-US')).toBeTruthy();
    });

    it('should render date and accessible status', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { getByLabelText, getByText } = renderTradeHistoryListItem(buyTrade);

        expect(getByText(/0[45]\/10\/2025,.*21/)).toBeTruthy();
        expect(getByLabelText('Trade in progress')).toBeTruthy();
    });

    it('should call onPress when pressed', () => {
        const onPress = jest.fn();
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const { getByText } = renderWithTradingHistoryProvider(
            <TradeHistoryListItem transaction={buyTrade} onPress={onPress} />,
        );

        fireEvent.press(getByText('$1,234.00'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
