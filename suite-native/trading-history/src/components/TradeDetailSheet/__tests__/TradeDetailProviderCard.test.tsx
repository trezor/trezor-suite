import { Linking } from 'react-native';

import { type TradingTransaction } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider, userEvent, waitFor } from '@suite-native/test-utils-store';
import {
    buyMercuryo,
    getBuyTrade,
    getInitializedTradingState,
} from '@suite-native/trading-fixtures';

import { TradeDetailProviderCard } from '../TradeDetailProviderCard';

const statusUrl = 'https://checkout.mercuryo.io/trade-history';

const getPreloadedState = (trades: TradingTransaction[]) => ({
    wallet: {
        trading: {
            ...getInitializedTradingState(),
            trades,
        },
    },
});

const getTrade = ({ shouldIncludeStatusUrl = false } = {}) => {
    const trade = getBuyTrade({ status: 'SUBMITTED' });

    return {
        ...trade,
        data: {
            ...trade.data,
            statusUrl: shouldIncludeStatusUrl ? statusUrl : undefined,
        },
    };
};

const renderProviderCard = (trade = getTrade()) =>
    renderWithStoreProvider(<TradeDetailProviderCard orderId={trade.data.orderId!} />, {
        preloadedState: getPreloadedState([trade]),
    });

describe('TradeDetailProviderCard', () => {
    const mockOpenURL = jest.spyOn(Linking, 'openURL');

    beforeEach(() => {
        mockOpenURL.mockClear();
    });

    it('should show status url when it is defined and open it on press', async () => {
        const { getByText } = renderProviderCard(getTrade({ shouldIncludeStatusUrl: true }));
        const statusLink = getByText(
            getTranslation('moduleTrading.tradeHistory.detail.checkOrderStatus'),
        );

        expect(statusLink).toBeOnTheScreen();

        await userEvent.press(statusLink);

        await waitFor(() => {
            expect(mockOpenURL).toHaveBeenCalledWith(statusUrl);
        });
    });

    it('should not show status url when it is not defined', () => {
        const { queryByText } = renderProviderCard();

        expect(
            queryByText(getTranslation('moduleTrading.tradeHistory.detail.checkOrderStatus')),
        ).not.toBeOnTheScreen();
    });

    it('should show support url when it is defined and open it on press', async () => {
        const { getByText } = renderProviderCard();

        const supportLink = getByText(
            getTranslation('moduleTrading.tradeHistory.detail.providerSupport'),
        );

        expect(supportLink).toBeOnTheScreen();

        await userEvent.press(supportLink);

        await waitFor(() => {
            expect(mockOpenURL).toHaveBeenCalledWith(buyMercuryo.supportUrl);
        });
    });
});
