import type { BuyTradeStatus, ExchangeTradeStatus, SellTradeStatus } from 'invity-api';

import { type TradingTransaction } from '@suite-common/trading';
import { act, fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';
import {
    buyMercuryo,
    exchangeMercuryo,
    getBuyTrade,
    getExchangeTrade,
    getInitializedTradingStateWithQuotes,
    getSellTrade,
    sellMercuryo,
} from '@suite-native/trading-fixtures';
import { mergeDeepObject } from '@trezor/utils';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
} from '../../../../__tests__/tradingTestUtils';
import { getTradeStatusStep } from '../../../../utils/general/utils';
import { TradeDetailAlert } from '../TradeDetailAlert';

// Note: this file uses `renderWithStoreProvider` (not `renderWithTradingProvider`) because several
// cases assert on the *absence* of the test provider in `providerInfos`. The trading provider would
// merge in a populated `providerInfos` from its base state, masking those fallback code paths.

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

const wrapAsPreloadedState = (
    trading: Record<string, unknown>,
): PreloadedStatePartial<TradingTestPreloadedState> => ({ wallet: { trading } });

/**
 * @param statusUrl
 *   - `undefined` → leave the test provider with its base fixture `statusUrl`
 *   - `null` → include the test provider but with `statusUrl: undefined` (tests support-url fallback)
 *   - `string` → include the test provider with the supplied `statusUrl`
 */
const preloadedStateWithTrades = (trades: TradingTransaction[], statusUrl?: string | null) => {
    const base = { ...getInitializedTradingStateWithQuotes(), trades };

    if (statusUrl === undefined) {
        return wrapAsPreloadedState(base);
    }

    const resolvedStatusUrl = statusUrl ?? undefined;

    return wrapAsPreloadedState(
        mergeDeepObject(base, {
            buy: {
                buyInfo: {
                    providerInfos: {
                        [TEST_PROVIDER]: { ...buyMercuryo, statusUrl: resolvedStatusUrl },
                    },
                },
            },
            sell: {
                sellInfo: {
                    providerInfos: {
                        [TEST_PROVIDER]: { ...sellMercuryo, statusUrl: resolvedStatusUrl },
                    },
                },
            },
            exchange: {
                exchangeInfo: {
                    providerInfos: {
                        [TEST_PROVIDER]: { ...exchangeMercuryo, statusUrl: resolvedStatusUrl },
                    },
                },
            },
        }),
    );
};

const preloadedStateWithoutTestProvider = (trades: TradingTransaction[]) => {
    const base = getInitializedTradingStateWithQuotes();
    const { [TEST_PROVIDER]: _omitted, ...buyProvidersWithoutTestProvider } =
        base.buy.buyInfo?.providerInfos ?? {};

    // `providerInfos` must be *replaced* (not merged) to drop the test provider entry, so we rebuild
    // `buy.buyInfo` manually instead of using `mergeDeepObject` which would merge the map back in.
    return wrapAsPreloadedState({
        ...base,
        trades,
        buy: {
            ...base.buy,
            buyInfo: { ...base.buy.buyInfo, providerInfos: buyProvidersWithoutTestProvider },
        },
    });
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
            { preloadedState: preloadedStateWithTrades([trade], statusUrl), providers: ['intl'] },
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
                { preloadedState: preloadedStateWithTrades([], undefined), providers: ['intl'] },
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
                { preloadedState: preloadedStateWithTrades([]), providers: ['intl'] },
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
                { preloadedState: preloadedStateWithTrades([]), providers: ['intl'] },
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
                { preloadedState: preloadedStateWithTrades([]), providers: ['intl'] },
            );

            expect(toJSON()).toBeNull();
        });

        it('should render error alert without button when trade and provider info is missing', () => {
            const { getByText, queryByText } = renderWithStoreProvider(
                <TradeDetailAlert
                    alertType="error"
                    provider={TEST_PROVIDER}
                    tradeType="buy"
                    orderId="test-order-id"
                    onOpenedBrowser={mockOnOpenedBrowser}
                />,
                { preloadedState: preloadedStateWithoutTestProvider([]), providers: ['intl'] },
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
                { preloadedState: preloadedStateWithTrades([], null), providers: ['intl'] },
            );

            act(() => {
                fireEvent.press(getByText('Proceed to pay'));
            });

            expect(mockOpenLink).toHaveBeenCalledWith(buyMercuryo.supportUrl);
        });

        it('should render button but not navigate when partnerData is missing for buy trades', () => {
            const baseBuyTrade = getBuyTrade({ status: 'SUBMITTED' });
            const { partnerData: _omitted, ...dataWithoutPartner } = baseBuyTrade.data;
            const buyTrade = { ...baseBuyTrade, data: dataWithoutPartner };

            const { getByText } = renderWithStoreProvider(
                <TradeDetailAlert
                    alertType="waiting"
                    provider={TEST_PROVIDER}
                    tradeType="buy"
                    orderId={buyTrade.data.orderId!}
                    onOpenedBrowser={mockOnOpenedBrowser}
                />,
                {
                    preloadedState: preloadedStateWithTrades([buyTrade], undefined), // No support URL
                    providers: ['intl'],
                },
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
                {
                    preloadedState: preloadedStateWithTrades(
                        [exchangeTrade],
                        TEST_PROVIDER_STATUS_URL,
                    ),
                    providers: ['intl'],
                },
            );

            act(() => {
                fireEvent.press(getByText('Go to provider support'));
            });

            // Should fall back to support URL for exchange trades
            expect(mockOpenLink).toHaveBeenCalledWith(exchangeMercuryo.supportUrl);
            expect(mockNavigation.navigate).not.toHaveBeenCalled();
        });

        it('should render button but not navigate when neither URL for browser auth nor support URL is available', () => {
            const baseBuyTrade = getBuyTrade({ status: 'SUBMITTED' });
            const { partnerData: _omitted, ...dataWithoutPartner } = baseBuyTrade.data;
            const buyTrade = { ...baseBuyTrade, data: dataWithoutPartner };

            const { getByText } = renderWithStoreProvider(
                <TradeDetailAlert
                    alertType="waiting"
                    provider={TEST_PROVIDER}
                    tradeType="buy"
                    orderId={buyTrade.data.orderId!}
                    onOpenedBrowser={mockOnOpenedBrowser}
                />,
                {
                    preloadedState: preloadedStateWithoutTestProvider([buyTrade]),
                    providers: ['intl'],
                },
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
            const baseSellTrade = getSellTrade({ status: 'ERROR' });
            const sellTrade = {
                ...baseSellTrade,
                data: { ...baseSellTrade.data, partnerData: 'https://sell.mercuryo.io/test' },
            };

            const { getByText } = renderWithStoreProvider(
                <TradeDetailAlert
                    alertType="error"
                    provider={TEST_PROVIDER}
                    tradeType="sell"
                    orderId={sellTrade.data.orderId!}
                    onOpenedBrowser={mockOnOpenedBrowser}
                />,
                {
                    preloadedState: preloadedStateWithTrades([sellTrade], TEST_PROVIDER_STATUS_URL),
                    providers: ['intl'],
                },
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
