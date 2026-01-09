import { TradingTransaction } from '@suite-common/trading';
import { EventType } from '@suite-native/analytics';
import { renderHook } from '@suite-native/test-utils';
import { getBuyTrade, getExchangeTrade } from '@suite-native/trading-fixtures';

import { useTransactionStateChangeAnalyticsReporting } from '../useTransactionStateChangeAnalyticsReporting';

// Mock analytics
jest.mock('@suite-native/analytics', () => ({
    EventType: {
        TradingStatus: 'trading-status',
    },
}));

const reportMock = jest.fn();

jest.mock('@suite-native/services', () => ({
    ...jest.requireActual('@suite-native/services'),
    useLegacyAnalytics: () => ({
        report: reportMock,
    }),
}));
describe('useTransactionStateChangeAnalyticsReporting', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        reportMock.mockClear();
    });

    it('should not report analytics when deviceTrades is empty', () => {
        renderHook(() => useTransactionStateChangeAnalyticsReporting([]));

        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should not report analytics when deviceTrades is undefined', () => {
        // The hook expects an array, so we need to handle this case
        expect(() => {
            renderHook(() => useTransactionStateChangeAnalyticsReporting(undefined as any));
        }).toThrow();
    });

    it('should not report analytics on first render for buy trade', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        renderHook(() => useTransactionStateChangeAnalyticsReporting([buyTrade]));

        // First render - should NOT report as it's the initial status
        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should report analytics for trade status change', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { rerender } = renderHook(
            ({ trades }: { trades: TradingTransaction[] }) =>
                useTransactionStateChangeAnalyticsReporting(trades),
            { initialProps: { trades: [buyTrade] } },
        );

        // Change status to SUCCESS
        const updatedBuyTrade = getBuyTrade({ status: 'SUCCESS' });
        rerender({ trades: [updatedBuyTrade] });

        expect(reportMock).toHaveBeenCalledWith({
            type: EventType.TradingStatus,
            payload: { type: 'buy', status: 'success' },
        });
        expect(reportMock).toHaveBeenCalledTimes(1);
    });

    it('should not report analytics when status remains the same', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { rerender } = renderHook<
            ReturnType<typeof useTransactionStateChangeAnalyticsReporting>,
            { trades: TradingTransaction[] }
        >(({ trades }) => useTransactionStateChangeAnalyticsReporting(trades), {
            initialProps: { trades: [buyTrade] },
        });

        // Same status - should not report
        rerender({ trades: [buyTrade] });

        expect(reportMock).not.toHaveBeenCalled(); // Still no calls
    });

    it('should handle multiple trades with different status changes', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });

        const { rerender } = renderHook<
            ReturnType<typeof useTransactionStateChangeAnalyticsReporting>,
            { trades: TradingTransaction[] }
        >(({ trades }) => useTransactionStateChangeAnalyticsReporting(trades), {
            initialProps: { trades: [buyTrade, exchangeTrade] },
        });

        // First render - should NOT report initial statuses
        expect(reportMock).not.toHaveBeenCalled();

        // Change both statuses
        const updatedBuyTrade = getBuyTrade({ status: 'SUCCESS' });
        const updatedExchangeTrade = getExchangeTrade({ status: 'SUCCESS' });
        rerender({ trades: [updatedBuyTrade, updatedExchangeTrade] });

        expect(reportMock).toHaveBeenCalledTimes(2);
        expect(reportMock).toHaveBeenNthCalledWith(1, {
            type: EventType.TradingStatus,
            payload: { type: 'buy', status: 'success' },
        });
        expect(reportMock).toHaveBeenNthCalledWith(2, {
            type: EventType.TradingStatus,
            payload: { type: 'exchange', status: 'success' },
        });
    });

    it('should handle trade with unknown key and not report analytics', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        // Remove ALL possible keys to make it truly unknown
        const tradeWithoutKeys = {
            ...buyTrade,
            key: undefined,
            data: {
                ...buyTrade.data,
                orderId: undefined,
                paymentId: undefined,
            },
        } as TradingTransaction;

        const { rerender } = renderHook<
            ReturnType<typeof useTransactionStateChangeAnalyticsReporting>,
            { trades: TradingTransaction[] }
        >(({ trades }) => useTransactionStateChangeAnalyticsReporting(trades), {
            initialProps: { trades: [tradeWithoutKeys] },
        });

        // First render - should NOT report due to unknown key
        expect(reportMock).not.toHaveBeenCalled();

        // Change status - should NOT report due to unknown key
        const updatedTrade = {
            ...tradeWithoutKeys,
            data: { ...tradeWithoutKeys.data, status: 'SUCCESS' },
        } as TradingTransaction;
        rerender({ trades: [updatedTrade] });

        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should handle trade with orderId as fallback key', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        // Remove the key but keep orderId
        const tradeWithOrderId = { ...buyTrade, key: undefined } as TradingTransaction;

        const { rerender } = renderHook<
            ReturnType<typeof useTransactionStateChangeAnalyticsReporting>,
            { trades: TradingTransaction[] }
        >(({ trades }) => useTransactionStateChangeAnalyticsReporting(trades), {
            initialProps: { trades: [tradeWithOrderId] },
        });

        // First render - should NOT report using orderId as key
        expect(reportMock).not.toHaveBeenCalled();

        // Change status - should report using orderId as key
        const updatedTrade = {
            ...tradeWithOrderId,
            data: { ...tradeWithOrderId.data, status: 'SUCCESS' },
        } as TradingTransaction;
        rerender({ trades: [updatedTrade] });

        expect(reportMock).toHaveBeenCalledWith({
            type: EventType.TradingStatus,
            payload: { type: 'buy', status: 'success' },
        });
        expect(reportMock).toHaveBeenCalledTimes(1);
    });

    it('should handle trade with paymentId as fallback key', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        // Remove the key and orderId but keep paymentId
        const tradeWithPaymentId = {
            ...buyTrade,
            key: undefined,
            data: { ...buyTrade.data, orderId: undefined },
        } as TradingTransaction;

        const { rerender } = renderHook<
            ReturnType<typeof useTransactionStateChangeAnalyticsReporting>,
            { trades: TradingTransaction[] }
        >(({ trades }) => useTransactionStateChangeAnalyticsReporting(trades), {
            initialProps: { trades: [tradeWithPaymentId] },
        });

        // First render - should NOT report using paymentId as key
        expect(reportMock).not.toHaveBeenCalled();

        // Change status - should report using paymentId as key
        const updatedTrade = {
            ...tradeWithPaymentId,
            data: { ...tradeWithPaymentId.data, status: 'SUCCESS' },
        } as TradingTransaction;
        rerender({ trades: [updatedTrade] });

        expect(reportMock).toHaveBeenCalledWith({
            type: EventType.TradingStatus,
            payload: { type: 'buy', status: 'success' },
        });
        expect(reportMock).toHaveBeenCalledTimes(1);
    });

    it('should handle trade with undefined status and not report analytics', () => {
        const buyTrade = getBuyTrade({ status: undefined });

        const { rerender } = renderHook<
            ReturnType<typeof useTransactionStateChangeAnalyticsReporting>,
            { trades: TradingTransaction[] }
        >(({ trades }) => useTransactionStateChangeAnalyticsReporting(trades), {
            initialProps: { trades: [buyTrade] },
        });

        // First render - should not report due to undefined status
        expect(reportMock).not.toHaveBeenCalled();

        // Change to defined status - should NOT report because previous status was undefined
        const updatedTrade = getBuyTrade({ status: 'SUCCESS' });
        rerender({ trades: [updatedTrade] });

        // Should not report because the previous status was undefined (not a meaningful change)
        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should handle trade status transitions correctly', () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });

        const { rerender } = renderHook<
            ReturnType<typeof useTransactionStateChangeAnalyticsReporting>,
            { trades: TradingTransaction[] }
        >(({ trades }) => useTransactionStateChangeAnalyticsReporting(trades), {
            initialProps: { trades: [exchangeTrade] },
        });

        // First render - should NOT report initial status
        expect(reportMock).not.toHaveBeenCalled();

        // CONVERTING -> KYC (maps to 'kyc')
        const kycTrade = getExchangeTrade({ status: 'KYC' });
        rerender({ trades: [kycTrade] });
        expect(reportMock).toHaveBeenCalledWith({
            type: EventType.TradingStatus,
            payload: { type: 'exchange', status: 'kyc' },
        });
        expect(reportMock).toHaveBeenCalledTimes(1);

        // KYC -> SUCCESS (maps to 'success')
        const successTrade = getExchangeTrade({ status: 'SUCCESS' });
        rerender({ trades: [successTrade] });
        expect(reportMock).toHaveBeenCalledWith({
            type: EventType.TradingStatus,
            payload: { type: 'exchange', status: 'success' },
        });
        expect(reportMock).toHaveBeenCalledTimes(2);
    });

    it('should handle error statuses correctly', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { rerender } = renderHook<
            ReturnType<typeof useTransactionStateChangeAnalyticsReporting>,
            { trades: TradingTransaction[] }
        >(({ trades }) => useTransactionStateChangeAnalyticsReporting(trades), {
            initialProps: { trades: [buyTrade] },
        });

        // First render - should NOT report initial status
        expect(reportMock).not.toHaveBeenCalled();

        // SUBMITTED -> ERROR (maps to 'error')
        const errorTrade = getBuyTrade({ status: 'ERROR' });
        rerender({ trades: [errorTrade] });
        expect(reportMock).toHaveBeenCalledWith({
            type: EventType.TradingStatus,
            payload: { type: 'buy', status: 'error' },
        });
        expect(reportMock).toHaveBeenCalledTimes(1);
    });

    it('should maintain previous statuses across re-renders', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { rerender } = renderHook<
            ReturnType<typeof useTransactionStateChangeAnalyticsReporting>,
            { trades: TradingTransaction[] }
        >(({ trades }) => useTransactionStateChangeAnalyticsReporting(trades), {
            initialProps: { trades: [buyTrade] },
        });

        // First render - should NOT report initial status
        expect(reportMock).not.toHaveBeenCalled();

        // Change status to SUCCESS
        const successTrade = getBuyTrade({ status: 'SUCCESS' });
        rerender({ trades: [successTrade] });
        expect(reportMock).toHaveBeenCalledTimes(1);

        // Change back to SUBMITTED - should report again
        rerender({ trades: [buyTrade] });
        expect(reportMock).toHaveBeenCalledTimes(2);
        expect(reportMock).toHaveBeenNthCalledWith(2, {
            type: EventType.TradingStatus,
            payload: { type: 'buy', status: 'waiting' },
        });
    });

    it('should handle trade with all fallback keys undefined and not report analytics', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        // Remove all possible keys
        const tradeWithoutKeys = {
            ...buyTrade,
            key: undefined,
            data: {
                ...buyTrade.data,
                orderId: undefined,
                paymentId: undefined,
            },
        } as TradingTransaction;

        const { rerender } = renderHook<
            ReturnType<typeof useTransactionStateChangeAnalyticsReporting>,
            { trades: TradingTransaction[] }
        >(({ trades }) => useTransactionStateChangeAnalyticsReporting(trades), {
            initialProps: { trades: [tradeWithoutKeys] },
        });

        // First render - should not report due to unknown key
        expect(reportMock).not.toHaveBeenCalled();

        // Change status - should not report due to unknown key
        const updatedTrade = {
            ...tradeWithoutKeys,
            data: { ...tradeWithoutKeys.data, status: 'SUCCESS' },
        } as TradingTransaction;
        rerender({ trades: [updatedTrade] });

        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should handle trades being removed from the list', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });

        const { rerender } = renderHook<
            ReturnType<typeof useTransactionStateChangeAnalyticsReporting>,
            { trades: TradingTransaction[] }
        >(({ trades }) => useTransactionStateChangeAnalyticsReporting(trades), {
            initialProps: { trades: [buyTrade, exchangeTrade] },
        });

        // First render - should NOT report
        expect(reportMock).not.toHaveBeenCalled();

        // Remove one trade
        rerender({ trades: [buyTrade] });
        expect(reportMock).not.toHaveBeenCalled();

        // Change status of remaining trade
        const updatedBuyTrade = getBuyTrade({ status: 'SUCCESS' });
        rerender({ trades: [updatedBuyTrade] });
        expect(reportMock).toHaveBeenCalledTimes(1);
        expect(reportMock).toHaveBeenCalledWith({
            type: EventType.TradingStatus,
            payload: { type: 'buy', status: 'success' },
        });
    });
});
