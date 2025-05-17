import { TradingTransaction } from '@suite-common/trading';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getBuyTrade, getSellTrade } from '../../../../__fixtures__/trades';
import { getInitializedTradingState } from '../../../../__fixtures__/tradingState';
import { TradeDetailHeader } from '../TradeDetailHeader';

const getPreloadedState = (trades: TradingTransaction[]) => ({
    wallet: {
        tradingNew: {
            ...getInitializedTradingState(),
            trades,
        },
    },
});

const mockNavigation = {
    navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
}));

describe('TradeDetailHeader', () => {
    it('should not render when trade is not found', async () => {
        const preloadedState = getPreloadedState([]);

        const { toJSON } = await renderWithStoreProviderAsync(
            <TradeDetailHeader orderId="nonexistent_order_id" onOpenedWebview={jest.fn()} />,
            { preloadedState },
        );

        expect(toJSON()).toBeNull();
    });

    it('should render header with spinner for in-progress trade', async () => {
        const buyTrade = getBuyTrade({ status: 'APPROVAL_PENDING' });
        const preloadedState = getPreloadedState([buyTrade]);

        const { getByTestId } = await renderWithStoreProviderAsync(
            <TradeDetailHeader orderId={buyTrade.data.orderId!} onOpenedWebview={jest.fn()} />,
            { preloadedState },
        );

        expect(getByTestId('@circular-spinner')).toBeTruthy();
    });

    it('should render header without spinner for final status', async () => {
        const sellTrade = getSellTrade({ status: 'SUCCESS' });
        const preloadedState = getPreloadedState([sellTrade]);

        const { queryByTestId } = await renderWithStoreProviderAsync(
            <TradeDetailHeader orderId={sellTrade.data.orderId!} onOpenedWebview={jest.fn()} />,
            { preloadedState },
        );

        expect(queryByTestId('@circular-spinner')).toBeNull();
    });

    it('should render error message for error status', async () => {
        const buyTrade = getBuyTrade({ status: 'ERROR' });
        const preloadedState = getPreloadedState([buyTrade]);

        const { getByText } = await renderWithStoreProviderAsync(
            <TradeDetailHeader orderId={buyTrade.data.orderId!} onOpenedWebview={jest.fn()} />,
            { preloadedState },
        );

        expect(getByText('Transaction failed')).toBeTruthy();
    });

    it('should render waiting message for waiting status', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const preloadedState = getPreloadedState([buyTrade]);

        const { getByText } = await renderWithStoreProviderAsync(
            <TradeDetailHeader orderId={buyTrade.data.orderId!} onOpenedWebview={jest.fn()} />,
            { preloadedState },
        );

        expect(getByText('Waiting for your payment ...')).toBeTruthy();
    });
});
