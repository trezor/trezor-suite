import { Linking } from 'react-native';

import { getTranslation } from '@suite-native/intl';
import { AppTabsRoutes, RootStackRoutes, TradingStackRoutes } from '@suite-native/navigation';
import { userEvent, waitFor } from '@suite-native/test-utils-store';
import {
    exchangeMercuryo,
    getBuyTrade,
    getExchangeTrade,
    getSellTrade,
} from '@suite-native/trading-fixtures';

import { TradingHistoryDetailActionButton } from './TradingHistoryDetailActionButton';
import { renderWithTradingHistoryProvider } from '../../test-utils/tradingHistoryTestUtils';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('TradingHistoryDetailActionButton', () => {
    const mockCanOpenURL = jest.spyOn(Linking, 'canOpenURL');
    const mockOpenURL = jest.spyOn(Linking, 'openURL');

    beforeEach(() => {
        jest.clearAllMocks();
        mockCanOpenURL.mockResolvedValue(true);
    });

    it.each([
        [getBuyTrade({ status: 'SUCCESS' }), 'buy'],
        [getSellTrade({ status: 'SUCCESS' }), 'sell'],
        [getExchangeTrade({ status: 'SUCCESS' }), 'exchange'],
    ] as const)('renders a primary button for a successful trade', (trade, translationKey) => {
        const { getByTestId, getByText } = renderWithTradingHistoryProvider(
            <TradingHistoryDetailActionButton
                providerName={trade.data.exchange}
                tradeType={trade.tradeType}
                status={trade.data.status}
            />,
        );

        expect(
            getByTestId('@trading-history/detail/action/start-new-trade/primary'),
        ).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation(
                    `moduleTrading.tradeHistory.detail.actionButton.startNew.${translationKey}`,
                ),
            ),
        ).toBeOnTheScreen();
    });

    it.each([
        [getBuyTrade({ status: 'ERROR' }), 'buy'],
        [getSellTrade({ status: 'ERROR' }), 'sell'],
        [getExchangeTrade({ status: 'ERROR' }), 'exchange'],
    ] as const)('renders a secondary button for a failed trade', (trade, translationKey) => {
        const { getByTestId, getByText } = renderWithTradingHistoryProvider(
            <TradingHistoryDetailActionButton
                providerName={trade.data.exchange}
                tradeType={trade.tradeType}
                status={trade.data.status}
            />,
        );

        expect(
            getByTestId('@trading-history/detail/action/start-new-trade/secondary'),
        ).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation(
                    `moduleTrading.tradeHistory.detail.actionButton.startNew.${translationKey}`,
                ),
            ),
        ).toBeOnTheScreen();
    });

    it.each([
        getBuyTrade({ status: 'SUBMITTED' }),
        getSellTrade({ status: 'PENDING' }),
        getExchangeTrade({ status: 'CONVERTING' }),
    ])('does not render a button for an in-progress trade', trade => {
        const { queryByTestId } = renderWithTradingHistoryProvider(
            <TradingHistoryDetailActionButton
                providerName={trade.data.exchange}
                tradeType={trade.tradeType}
                status={trade.data.status}
            />,
        );

        expect(queryByTestId('@trading-history/detail/action/start-new-trade/primary')).toBeNull();
        expect(
            queryByTestId('@trading-history/detail/action/start-new-trade/secondary'),
        ).toBeNull();
        expect(queryByTestId('@trading-history/detail/action/contact-provider')).toBeNull();
    });

    it('opens the matching trading form for the start-new-trade action', async () => {
        const trade = getExchangeTrade({ status: 'SUCCESS' });
        const { getByTestId } = renderWithTradingHistoryProvider(
            <TradingHistoryDetailActionButton
                providerName={trade.data.exchange}
                tradeType={trade.tradeType}
                status={trade.data.status}
            />,
        );

        await userEvent.press(
            getByTestId('@trading-history/detail/action/start-new-trade/primary'),
        );

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.TradeStack,
            params: {
                screen: TradingStackRoutes.Trading,
                params: { tradingType: 'exchange' },
            },
        });
    });

    it('opens provider support for the KYC action', async () => {
        const trade = getExchangeTrade({ status: 'KYC' });
        const { getByTestId, getByText } = renderWithTradingHistoryProvider(
            <TradingHistoryDetailActionButton
                providerName={trade.data.exchange}
                tradeType={trade.tradeType}
                status={trade.data.status}
            />,
        );

        const contactProviderButton = getByTestId(
            '@trading-history/detail/action/contact-provider',
        );

        expect(contactProviderButton).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation('moduleTrading.tradeHistory.detail.actionButton.contactProvider', {
                    providerName: exchangeMercuryo.companyName,
                }),
            ),
        ).toBeOnTheScreen();

        await userEvent.press(contactProviderButton);

        await waitFor(() => {
            expect(mockOpenURL).toHaveBeenCalledWith(exchangeMercuryo.supportUrl);
        });
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not render the KYC action when provider support is unavailable', () => {
        const trade = getExchangeTrade({ status: 'KYC' });
        const { queryByTestId } = renderWithTradingHistoryProvider(
            <TradingHistoryDetailStatusAction
                providerName="provider-without-metadata"
                tradeType={trade.tradeType}
                status={trade.data.status}
            />,
        );

        expect(
            queryByTestId('@trading-history/detail/action/contact-provider'),
        ).not.toBeOnTheScreen();
    });
});
