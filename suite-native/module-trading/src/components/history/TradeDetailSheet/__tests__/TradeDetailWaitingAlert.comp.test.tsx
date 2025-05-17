import { TradingTransaction } from '@suite-common/trading';
import { fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getBuyTrade } from '../../../../__fixtures__/trades';
import { getInitializedTradingState } from '../../../../__fixtures__/tradingState';
import { TradeDetailWaitingAlert } from '../TradeDetailWaitingAlert';

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

describe('TradeDetailWaitingAlert', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should navigate to webview when payment button is pressed', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const preloadedState = getPreloadedState([buyTrade]);

        const { getByText } = await renderWithStoreProviderAsync(
            <TradeDetailWaitingAlert
                orderId={buyTrade.data.orderId!}
                onOpenedWebview={jest.fn()}
            />,
            { preloadedState },
        );

        fireEvent.press(getByText('Proceed to pay'));

        expect(mockNavigation.navigate).toHaveBeenCalledWith('TradingWebView', {
            closeCallbackUrl:
                'trezorsuitelite://trading?action=trade&tradeType=buy&orderId=d3ef3451-8f68-4250-9e08-580ece5e7d12',
            source: { uri: buyTrade.data.partnerData },
        });
    });

    it('should not render the payment button if partnerData is missing', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        delete buyTrade.data.partnerData;
        const preloadedState = getPreloadedState([buyTrade]);

        const { queryByText } = await renderWithStoreProviderAsync(
            <TradeDetailWaitingAlert
                orderId={buyTrade.data.orderId!}
                onOpenedWebview={jest.fn()}
            />,
            { preloadedState },
        );

        expect(queryByText('Proceed to pay')).toBeNull();
    });
});
