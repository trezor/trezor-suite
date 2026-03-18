import type { BuyTradeStatus, ExchangeTradeStatus, SellTradeStatus } from 'invity-api';

import { type TradingTransaction } from '@suite-common/trading';
import {
    type PreloadedState,
    act,
    fireEvent,
    renderWithStoreProvider,
} from '@suite-native/test-utils';
import {
    buyMercuryo,
    exchangeMercuryo,
    getBuyTrade,
    getExchangeTrade,
    getInitializedTradingStateWithQuotes,
    getSellTrade,
    sellMercuryo,
} from '@suite-native/trading-fixtures';

import { getTradeStatusStep } from '../../../../utils/general/utils';
import { TradeDetailAlert } from '../TradeDetailAlert';

const TEST_PROVIDER = 'mercuryo';
const TEST_PROVIDER_STATUS_URL = 'https://checkout.mercuryo.io/trade-history';

const mockOpenLink = jest.fn();
const mockOnOpenedBrowser = jest.fn();
const mockNavigation = {
    navigate: jest.fn(),
};

jest.mock('@suite-native/link', () => ({
    useOpenLink: () => mockOpenLink,
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
}));

const createPreloadedState = (
    trades: TradingTransaction[],
    statusUrl?: string | null,
): PreloadedState => {
    const tradingState = getInitializedTradingStateWithQuotes();
    tradingState.trades = trades;

    // Only add provider info if statusUrl is provided
    if (statusUrl !== undefined) {
        // null used to exclude statusUrl from provider info for testing fallback behavior
        if (statusUrl === null) {
            statusUrl = undefined;
        }

        const buyProviderInfo = {
            ...buyMercuryo,
            statusUrl,
        };
        const sellProviderInfo = {
            ...sellMercuryo,
            statusUrl,
        };
        const exchangeProviderInfo = {
            ...exchangeMercuryo,
            statusUrl,
        };

        if (tradingState.buy.buyInfo?.providerInfos) {
            tradingState.buy.buyInfo.providerInfos[TEST_PROVIDER] = buyProviderInfo;
        }
        if (tradingState.sell.sellInfo?.providerInfos) {
            tradingState.sell.sellInfo.providerInfos[TEST_PROVIDER] = sellProviderInfo;
        }
        if (tradingState.exchange.exchangeInfo?.providerInfos) {
            tradingState.exchange.exchangeInfo.providerInfos[TEST_PROVIDER] = exchangeProviderInfo;
        }
    }

    return {
        wallet: {
            trading: tradingState,
        },
    };
};

describe('TradeDetailAlert', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderAlert = (
        tradeStatus: BuyTradeStatus | ExchangeTradeStatus | SellTradeStatus,
        tradeType: 'buy' | 'exchange' | 'sell' = 'buy',
        statusUrl?: string,
        orderId?: string,
    ) => {
        let trade;
        if (tradeType === 'exchange') {
            trade = getExchangeTrade({ status: tradeStatus as ExchangeTradeStatus });
        } else if (tradeType === 'sell') {
            trade = getSellTrade({ status: tradeStatus as SellTradeStatus });
        } else {
            trade = getBuyTrade({ status: tradeStatus as BuyTradeStatus });
        }

        const alertType = getTradeStatusStep(trade);

        return renderWithStoreProvider(
            <TradeDetailAlert
                alertType={alertType}
                provider={TEST_PROVIDER}
                tradeType={tradeType}
                orderId={orderId || trade.data.orderId}
                onOpenedBrowser={mockOnOpenedBrowser}
            />,
            { preloadedState: createPreloadedState([trade], statusUrl) },
        );
    };

    describe('Error Alert', () => {
        it('should render error alert with support button for buy trades', () => {
            const { getByText } = renderAlert('ERROR', 'buy', TEST_PROVIDER_STATUS_URL);

            expect(getByText('Transaction failed')).toBeTruthy();
            expect(getByText('Go to provider support')).toBeTruthy();
        });

        it('should render error alert with support button for sell trades', () => {
            const { getByText } = renderAlert('ERROR', 'sell', TEST_PROVIDER_STATUS_URL);

            expect(getByText('Transaction failed')).toBeTruthy();
            expect(getByText('Go to provider support')).toBeTruthy();
        });
    });

    describe('Waiting Alert', () => {
        it('should render waiting alert with payment button when orderId is provided', () => {
            const { getByText } = renderAlert('SUBMITTED', 'buy', undefined, 'test-order-id');

            expect(getByText('Waiting for your payment ...')).toBeTruthy();
            expect(getByText('Proceed to pay')).toBeTruthy();
        });

        it('should render button but not navigate when trade is not found in store', () => {
            const { getByText } = renderWithStoreProvider(
                <TradeDetailAlert
                    alertType="waiting"
                    provider={TEST_PROVIDER}
                    tradeType="buy"
                    orderId="nonexistent-order-id"
                    onOpenedBrowser={mockOnOpenedBrowser}
                />,
                { preloadedState: createPreloadedState([], undefined) }, // No trades in store
            );

            expect(getByText('Proceed to pay')).toBeTruthy();

            act(() => {
                fireEvent.press(getByText('Proceed to pay'));
            });

            // Should not call onOpenedBrowser when trade is not found
            expect(mockOnOpenedBrowser).not.toHaveBeenCalled();
            expect(mockNavigation.navigate).not.toHaveBeenCalled();
        });
    });

    describe('KYC Alert', () => {
        it('should render kyc alert with support button when orderId is provided', () => {
            const { getByText } = renderAlert('KYC', 'exchange', undefined, 'test-order-id');

            expect(getByText('Identity verification required')).toBeTruthy();
            expect(getByText('Go to provider support')).toBeTruthy();
        });
    });

    describe('Converting Alert', () => {
        it('should render converting alert with support button', () => {
            const { getByText } = renderAlert('CONVERTING', 'exchange', TEST_PROVIDER_STATUS_URL);

            expect(getByText('Converting your crypto...')).toBeTruthy();
            expect(getByText('Go to provider support')).toBeTruthy();
        });
    });

    describe('Sending Alert', () => {
        it('should render sending alert with support button', () => {
            const { getByText } = renderAlert('SENDING', 'exchange', TEST_PROVIDER_STATUS_URL);

            expect(getByText('Sending your crypto...')).toBeTruthy();
            expect(getByText('Go to provider support')).toBeTruthy();
        });
    });

    describe('Sell Trade Alerts', () => {
        it('should not render alert for sell trades with SUCCESS status', () => {
            const { toJSON } = renderWithStoreProvider(
                <TradeDetailAlert
                    alertType="success"
                    provider={TEST_PROVIDER}
                    tradeType="sell"
                    orderId="test-order-id"
                    onOpenedBrowser={mockOnOpenedBrowser}
                />,
                { preloadedState: createPreloadedState([]) },
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render alert for sell trades with SEND_CRYPTO status (pending)', () => {
            const { toJSON } = renderAlert('SEND_CRYPTO', 'sell');

            expect(toJSON()).toBeNull();
        });
    });

    describe('Support Button Functionality', () => {
        it.each([
            ['ERROR', 'buy', TEST_PROVIDER_STATUS_URL],
            ['ERROR', 'exchange', TEST_PROVIDER_STATUS_URL],
            ['ERROR', 'sell', TEST_PROVIDER_STATUS_URL],
            ['KYC', 'exchange', exchangeMercuryo.supportUrl],
            ['CONVERTING', 'exchange', TEST_PROVIDER_STATUS_URL],
            ['SENDING', 'exchange', TEST_PROVIDER_STATUS_URL],
        ])(
            'should call openLink with status URL when support button is pressed for %s %s trades',
            (status, tradeType, expectedUrl) => {
                const { getByText } = renderAlert(status as any, tradeType as any, expectedUrl);

                act(() => {
                    fireEvent.press(getByText('Go to provider support'));
                });

                expect(mockOpenLink).toHaveBeenCalledWith(expectedUrl);
            },
        );
    });

    describe('Edge Cases', () => {
        it('should not render when alertType is undefined', () => {
            const { toJSON } = renderWithStoreProvider(
                <TradeDetailAlert
                    alertType={undefined as any}
                    provider={TEST_PROVIDER}
                    tradeType="buy"
                    orderId="test-order-id"
                    onOpenedBrowser={mockOnOpenedBrowser}
                />,
                { preloadedState: createPreloadedState([]) },
            );

            expect(toJSON()).toBeNull();
        });

        it('should not render when alertType is success for non-exchange trades', () => {
            const { toJSON } = renderWithStoreProvider(
                <TradeDetailAlert
                    alertType="success"
                    provider={TEST_PROVIDER}
                    tradeType="buy"
                    orderId="test-order-id"
                    onOpenedBrowser={mockOnOpenedBrowser}
                />,
                { preloadedState: createPreloadedState([]) },
            );

            expect(toJSON()).toBeNull();
        });

        it('should render error alert without button when trade and provider info is missing', () => {
            const tradingState = getInitializedTradingStateWithQuotes();
            tradingState.trades = [];
            if (tradingState.buy.buyInfo?.providerInfos) {
                delete tradingState.buy.buyInfo.providerInfos[TEST_PROVIDER];
            }

            const { getByText, queryByText } = renderWithStoreProvider(
                <TradeDetailAlert
                    alertType="error"
                    provider={TEST_PROVIDER}
                    tradeType="buy"
                    orderId="test-order-id"
                    onOpenedBrowser={mockOnOpenedBrowser}
                />,
                { preloadedState: { wallet: { trading: tradingState } } },
            );

            expect(getByText('Transaction failed')).toBeTruthy();
            expect(queryByText('Go to provider support')).toBeNull();
        });

        it('should render waiting alert with support fallback when statusUrl is missing', () => {
            const { getByText } = renderWithStoreProvider(
                <TradeDetailAlert
                    alertType="waiting"
                    provider={TEST_PROVIDER}
                    tradeType="buy"
                    orderId={undefined}
                    onOpenedBrowser={mockOnOpenedBrowser}
                />,
                { preloadedState: createPreloadedState([], null) },
            );

            act(() => {
                fireEvent.press(getByText('Proceed to pay'));
            });

            expect(mockOpenLink).toHaveBeenCalledWith(buyMercuryo.supportUrl);
        });

        it('should render button but not navigate when partnerData is missing for buy trades', () => {
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
            // Remove partnerData to test missing url for browser navigation
            delete buyTrade.data.partnerData;

            const { getByText } = renderWithStoreProvider(
                <TradeDetailAlert
                    alertType="waiting"
                    provider={TEST_PROVIDER}
                    tradeType="buy"
                    orderId={buyTrade.data.orderId!}
                    onOpenedBrowser={mockOnOpenedBrowser}
                />,
                { preloadedState: createPreloadedState([buyTrade], undefined) }, // No support URL
            );

            act(() => {
                fireEvent.press(getByText('Proceed to pay'));
            });

            // Should not navigate when partnerData is missing
            expect(mockNavigation.navigate).not.toHaveBeenCalled();
            expect(mockOnOpenedBrowser).not.toHaveBeenCalled();
        });

        it('should fall back to support URL when partnerData is missing for exchange trades', () => {
            const exchangeTrade = getExchangeTrade({ status: 'KYC' });
            // Exchange trades don't have partnerData, so they always fall back to support URL

            const { getByText } = renderWithStoreProvider(
                <TradeDetailAlert
                    alertType="kyc"
                    provider={TEST_PROVIDER}
                    tradeType="exchange"
                    orderId={exchangeTrade.data.orderId!}
                    onOpenedBrowser={mockOnOpenedBrowser}
                />,
                { preloadedState: createPreloadedState([exchangeTrade], TEST_PROVIDER_STATUS_URL) },
            );

            act(() => {
                fireEvent.press(getByText('Go to provider support'));
            });

            // Should fall back to support URL for exchange trades
            expect(mockOpenLink).toHaveBeenCalledWith(exchangeMercuryo.supportUrl);
            expect(mockNavigation.navigate).not.toHaveBeenCalled();
        });

        it('should render button but not navigate when neither URL for browser auth nor support URL is available', () => {
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
            // Remove partnerData to test missing url for browser navigation
            delete buyTrade.data.partnerData;

            // Create state without provider info to test no support URL case
            const tradingState = getInitializedTradingStateWithQuotes();
            tradingState.trades = [buyTrade];
            // Remove provider info to ensure no support URL
            if (tradingState.buy.buyInfo?.providerInfos) {
                delete tradingState.buy.buyInfo.providerInfos[TEST_PROVIDER];
            }

            const { getByText } = renderWithStoreProvider(
                <TradeDetailAlert
                    alertType="waiting"
                    provider={TEST_PROVIDER}
                    tradeType="buy"
                    orderId={buyTrade.data.orderId!}
                    onOpenedBrowser={mockOnOpenedBrowser}
                />,
                { preloadedState: { wallet: { trading: tradingState } } },
            );

            act(() => {
                fireEvent.press(getByText('Proceed to pay'));
            });

            // Should not navigate when neither partner authentication URL nor support URL is available
            expect(mockNavigation.navigate).not.toHaveBeenCalled();
            expect(mockOnOpenedBrowser).not.toHaveBeenCalled();
            expect(mockOpenLink).not.toHaveBeenCalled();
        });

        it('should handle sell trades with browser navigation when partnerData is available', () => {
            const sellTrade = getSellTrade({ status: 'ERROR' });
            // Ensure partnerData is present for browser navigation
            sellTrade.data.partnerData = 'https://sell.mercuryo.io/test';

            const { getByText } = renderWithStoreProvider(
                <TradeDetailAlert
                    alertType="error"
                    provider={TEST_PROVIDER}
                    tradeType="sell"
                    orderId={sellTrade.data.orderId!}
                    onOpenedBrowser={mockOnOpenedBrowser}
                />,
                { preloadedState: createPreloadedState([sellTrade], TEST_PROVIDER_STATUS_URL) },
            );

            act(() => {
                fireEvent.press(getByText('Go to provider support'));
            });

            // Should call status URL for sell trades (not browser auth navigation)
            expect(mockOpenLink).toHaveBeenCalledWith(TEST_PROVIDER_STATUS_URL);
            expect(mockNavigation.navigate).not.toHaveBeenCalled();
        });
    });
});
