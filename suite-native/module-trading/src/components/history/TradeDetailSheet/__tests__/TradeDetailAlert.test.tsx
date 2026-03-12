import type { BuyTradeStatus, ExchangeTradeStatus, SellTradeStatus } from 'invity-api';

import { TradingTransaction } from '@suite-common/trading';
import { act, fireEvent } from '@suite-native/test-utils';
import { type PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import {
    buyMercuryo,
    exchangeMercuryo,
    getBuyTrade,
    getExchangeTrade,
    getInitializedTradingStateWithQuotes,
    getSellTrade,
} from '@suite-native/trading-fixtures';

import { getTradeStatusStep } from '../../../../utils/general/utils';
import { TradeDetailAlert } from '../TradeDetailAlert';

const TEST_PROVIDER = 'mercuryo';
const TEST_BUY_STATUS_URL = 'https://checkout.mercuryo.io/status/{{originalPaymentId}}';
const TEST_EXCHANGE_STATUS_URL = 'https://checkout.mercuryo.io/status/{{orderId}}';
const TEST_SELL_STATUS_URL = 'https://checkout.mercuryo.io/sell/status/{{orderId}}';

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
    supportUrl?: string,
): PreloadedState => {
    const tradingState = getInitializedTradingStateWithQuotes();
    tradingState.trades = trades;

    // Only add provider info if supportUrl is provided
    if (supportUrl !== undefined) {
        const buyProviderInfo = {
            ...buyMercuryo,
            supportUrl,
        };

        const exchangeProviderInfo = {
            ...exchangeMercuryo,
            supportUrl,
        };

        if (tradingState.buy.buyInfo?.providerInfos) {
            tradingState.buy.buyInfo.providerInfos[TEST_PROVIDER] = buyProviderInfo;
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
        supportUrl?: string,
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

        return renderWithStoreProviderAsync(
            <TradeDetailAlert
                alertType={alertType}
                provider={TEST_PROVIDER}
                tradeType={tradeType}
                orderId={orderId || trade.data.orderId}
                onOpenedBrowser={mockOnOpenedBrowser}
            />,
            { preloadedState: createPreloadedState([trade], supportUrl) },
        );
    };

    describe('Error Alert', () => {
        it('should render error alert with support button for buy trades', async () => {
            const { getByText } = await renderAlert('ERROR', 'buy', TEST_BUY_STATUS_URL);

            expect(getByText('Transaction failed')).toBeTruthy();
            expect(getByText('Go to provider support')).toBeTruthy();
        });

        it('should render error alert with support button for sell trades', async () => {
            const { getByText } = await renderAlert('ERROR', 'sell', TEST_SELL_STATUS_URL);

            expect(getByText('Transaction failed')).toBeTruthy();
            expect(getByText('Go to provider support')).toBeTruthy();
        });
    });

    describe('Waiting Alert', () => {
        it('should render waiting alert with payment button when orderId is provided', async () => {
            const { getByText } = await renderAlert('SUBMITTED', 'buy', undefined, 'test-order-id');

            expect(getByText('Waiting for your payment ...')).toBeTruthy();
            expect(getByText('Proceed to pay')).toBeTruthy();
        });

        it('should render button but not navigate when trade is not found in store', async () => {
            const { getByText } = await renderWithStoreProviderAsync(
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
        it('should render kyc alert with support button when orderId is provided', async () => {
            const { getByText } = await renderAlert('KYC', 'exchange', undefined, 'test-order-id');

            expect(getByText('Identity verification required')).toBeTruthy();
            expect(getByText('Go to provider support')).toBeTruthy();
        });
    });

    describe('Converting Alert', () => {
        it('should render converting alert with support button', async () => {
            const { getByText } = await renderAlert(
                'CONVERTING',
                'exchange',
                TEST_EXCHANGE_STATUS_URL,
            );

            expect(getByText('Converting your crypto...')).toBeTruthy();
            expect(getByText('Go to provider support')).toBeTruthy();
        });
    });

    describe('Sending Alert', () => {
        it('should render sending alert with support button', async () => {
            const { getByText } = await renderAlert(
                'SENDING',
                'exchange',
                TEST_EXCHANGE_STATUS_URL,
            );

            expect(getByText('Sending your crypto...')).toBeTruthy();
            expect(getByText('Go to provider support')).toBeTruthy();
        });
    });

    describe('Sell Trade Alerts', () => {
        it('should not render alert for sell trades with SUCCESS status', async () => {
            const { toJSON } = await renderWithStoreProviderAsync(
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

        it('should not render alert for sell trades with SEND_CRYPTO status (pending)', async () => {
            const { toJSON } = await renderAlert('SEND_CRYPTO', 'sell');

            expect(toJSON()).toBeNull();
        });
    });

    describe('Support Button Functionality', () => {
        it.each([
            [
                'ERROR',
                'buy',
                'https://checkout.mercuryo.io/#status/7546b3a9-ba27-4c9c-b3ae-45524fe63a97',
            ],
            [
                'ERROR',
                'exchange',
                'https://checkout.mercuryo.io/#status/12ffba9e-7370-4a6e-87dc-aefd3851c735',
            ],
            [
                'ERROR',
                'sell',
                'https://checkout.mercuryo.io/sell/status/d369ba9e-7370-4a6e-87dc-aefd3851c735',
            ],
            [
                'KYC',
                'exchange',
                'https://checkout.mercuryo.io/#status/12ffba9e-7370-4a6e-87dc-aefd3851c735',
            ],
            [
                'CONVERTING',
                'exchange',
                'https://checkout.mercuryo.io/#status/12ffba9e-7370-4a6e-87dc-aefd3851c735',
            ],
            [
                'SENDING',
                'exchange',
                'https://checkout.mercuryo.io/#status/12ffba9e-7370-4a6e-87dc-aefd3851c735',
            ],
        ])(
            'should call openLink with support URL when support button is pressed for %s %s trades',
            async (status, tradeType, expectedUrl) => {
                const { getByText } = await renderAlert(
                    status as any,
                    tradeType as any,
                    expectedUrl,
                );

                act(() => {
                    fireEvent.press(getByText('Go to provider support'));
                });

                expect(mockOpenLink).toHaveBeenCalledWith(expectedUrl);
            },
        );
    });

    describe('Edge Cases', () => {
        it('should not render when alertType is undefined', async () => {
            const { toJSON } = await renderWithStoreProviderAsync(
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

        it('should not render when alertType is success for non-exchange trades', async () => {
            const { toJSON } = await renderWithStoreProviderAsync(
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

        it('should render error alert without button when provider info is missing', async () => {
            const tradingState = getInitializedTradingStateWithQuotes();
            tradingState.trades = [];
            if (tradingState.buy.buyInfo?.providerInfos) {
                delete tradingState.buy.buyInfo.providerInfos[TEST_PROVIDER];
            }

            const { getByText, queryByText } = await renderWithStoreProviderAsync(
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

        it('should render waiting alert with support fallback when orderId is missing', async () => {
            const { getByText } = await renderWithStoreProviderAsync(
                <TradeDetailAlert
                    alertType="waiting"
                    provider={TEST_PROVIDER}
                    tradeType="buy"
                    orderId={undefined}
                    onOpenedBrowser={mockOnOpenedBrowser}
                />,
                { preloadedState: createPreloadedState([], TEST_BUY_STATUS_URL) },
            );

            act(() => {
                fireEvent.press(getByText('Proceed to pay'));
            });

            expect(mockOpenLink).toHaveBeenCalledWith('https://checkout.mercuryo.io/#status/');
        });

        it('should render button but not navigate when partnerData is missing for buy trades', async () => {
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
            // Remove partnerData to test missing url for browser navigation
            delete buyTrade.data.partnerData;

            const { getByText } = await renderWithStoreProviderAsync(
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

        it('should fall back to support URL when partnerData is missing for exchange trades', async () => {
            const exchangeTrade = getExchangeTrade({ status: 'KYC' });
            // Exchange trades don't have partnerData, so they always fall back to support URL

            const { getByText } = await renderWithStoreProviderAsync(
                <TradeDetailAlert
                    alertType="kyc"
                    provider={TEST_PROVIDER}
                    tradeType="exchange"
                    orderId={exchangeTrade.data.orderId!}
                    onOpenedBrowser={mockOnOpenedBrowser}
                />,
                { preloadedState: createPreloadedState([exchangeTrade], TEST_EXCHANGE_STATUS_URL) },
            );

            act(() => {
                fireEvent.press(getByText('Go to provider support'));
            });

            // Should fall back to support URL for exchange trades
            expect(mockOpenLink).toHaveBeenCalledWith(
                'https://checkout.mercuryo.io/#status/12ffba9e-7370-4a6e-87dc-aefd3851c735',
            );
            expect(mockNavigation.navigate).not.toHaveBeenCalled();
        });

        it('should render button but not navigate when neither URL for browser auth nor support URL is available', async () => {
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

            const { getByText } = await renderWithStoreProviderAsync(
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

        it('should handle sell trades with browser navigation when partnerData is available', async () => {
            const sellTrade = getSellTrade({ status: 'ERROR' });
            // Ensure partnerData is present for browser navigation
            sellTrade.data.partnerData = 'https://sell.mercuryo.io/test';

            const { getByText } = await renderWithStoreProviderAsync(
                <TradeDetailAlert
                    alertType="error"
                    provider={TEST_PROVIDER}
                    tradeType="sell"
                    orderId={sellTrade.data.orderId!}
                    onOpenedBrowser={mockOnOpenedBrowser}
                />,
                { preloadedState: createPreloadedState([sellTrade], TEST_SELL_STATUS_URL) },
            );

            act(() => {
                fireEvent.press(getByText('Go to provider support'));
            });

            // Should call support URL for sell trades (not browser auth navigation)
            expect(mockOpenLink).toHaveBeenCalledWith(
                'https://checkout.mercuryo.io/sell/status/d369ba9e-7370-4a6e-87dc-aefd3851c735',
            );
            expect(mockNavigation.navigate).not.toHaveBeenCalled();
        });
    });
});
