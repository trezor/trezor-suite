import React from 'react';

import { type TradingTransaction } from '@suite-common/trading';
import { events } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';
import { renderHook, renderHookWithProviders } from '@suite-native/test-utils';
import { getBuyTrade, getExchangeTrade } from '@suite-native/trading-fixtures';

import { useTransactionStateChangeAnalyticsReporting } from '../useTransactionStateChangeAnalyticsReporting';

type Props = { trades: TradingTransaction[] };
type ReportSpy = jest.SpyInstance;

const useHookWithReportSpy = (trades: TradingTransaction[]) => {
    const analytics = useAnalytics();

    const spyRef = React.useRef<ReportSpy | null>(null);

    if (!spyRef.current) {
        spyRef.current = jest.spyOn(analytics, 'report');
    }

    useTransactionStateChangeAnalyticsReporting(trades);

    return spyRef.current!;
};

describe('useTransactionStateChangeAnalyticsReporting', () => {
    const activeSpies: ReportSpy[] = [];
    let reportMock: jest.Mock;

    const setup = (initialTrades: TradingTransaction[]) => {
        const hook = renderHookWithProviders(({ trades }: Props) => useHookWithReportSpy(trades), {
            providers: ['intl'],
            initialProps: { trades: initialTrades },
        });

        const spy = hook.result.current;
        activeSpies.push(spy);

        reportMock = spy as unknown as jest.Mock;

        return hook;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        if (reportMock) reportMock.mockClear();
    });

    afterEach(() => {
        while (activeSpies.length) {
            activeSpies.pop()!.mockRestore();
        }
        reportMock = undefined as unknown as jest.Mock;
    });

    it('should not report analytics when deviceTrades is empty', () => {
        setup([]);

        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should not report analytics when deviceTrades is undefined', () => {
        expect(() => {
            renderHook(() => useTransactionStateChangeAnalyticsReporting(undefined as any));
        }).toThrow();
    });

    it('should not report analytics on first render for buy trade', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        setup([buyTrade]);

        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should report analytics for trade status change', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { rerender } = setup([buyTrade]);

        const updatedBuyTrade = getBuyTrade({ status: 'SUCCESS' });
        rerender({ trades: [updatedBuyTrade] });

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingStatusEvent.name,
            payload: { type: 'buy', status: 'success' },
        });
        expect(reportMock).toHaveBeenCalledTimes(1);
    });

    it('should not report analytics when status remains the same', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { rerender } = setup([buyTrade]);

        rerender({ trades: [buyTrade] });

        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should handle multiple trades with different status changes', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });

        const { rerender } = setup([buyTrade, exchangeTrade]);

        expect(reportMock).not.toHaveBeenCalled();

        const updatedBuyTrade = getBuyTrade({ status: 'SUCCESS' });
        const updatedExchangeTrade = getExchangeTrade({ status: 'SUCCESS' });
        rerender({ trades: [updatedBuyTrade, updatedExchangeTrade] });

        expect(reportMock).toHaveBeenCalledTimes(2);
        expect(reportMock).toHaveBeenNthCalledWith(1, {
            type: events.tradingStatusEvent.name,
            payload: { type: 'buy', status: 'success' },
        });
        expect(reportMock).toHaveBeenNthCalledWith(2, {
            type: events.tradingStatusEvent.name,
            payload: { type: 'exchange', status: 'success' },
        });
    });

    it('should handle trade with unknown key and not report analytics', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const tradeWithoutKeys = {
            ...buyTrade,
            key: undefined,
            data: {
                ...buyTrade.data,
                orderId: undefined,
                paymentId: undefined,
            },
        } as TradingTransaction;

        const { rerender } = setup([tradeWithoutKeys]);

        expect(reportMock).not.toHaveBeenCalled();

        const updatedTrade = {
            ...tradeWithoutKeys,
            data: { ...tradeWithoutKeys.data, status: 'SUCCESS' },
        } as TradingTransaction;
        rerender({ trades: [updatedTrade] });

        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should handle trade with orderId as fallback key', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const tradeWithOrderId = { ...buyTrade, key: undefined } as TradingTransaction;

        const { rerender } = setup([tradeWithOrderId]);

        expect(reportMock).not.toHaveBeenCalled();

        const updatedTrade = {
            ...tradeWithOrderId,
            data: { ...tradeWithOrderId.data, status: 'SUCCESS' },
        } as TradingTransaction;
        rerender({ trades: [updatedTrade] });

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingStatusEvent.name,
            payload: { type: 'buy', status: 'success' },
        });
        expect(reportMock).toHaveBeenCalledTimes(1);
    });

    it('should handle trade with paymentId as fallback key', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const tradeWithPaymentId = {
            ...buyTrade,
            key: undefined,
            data: { ...buyTrade.data, orderId: undefined },
        } as TradingTransaction;

        const { rerender } = setup([tradeWithPaymentId]);

        expect(reportMock).not.toHaveBeenCalled();

        const updatedTrade = {
            ...tradeWithPaymentId,
            data: { ...tradeWithPaymentId.data, status: 'SUCCESS' },
        } as TradingTransaction;
        rerender({ trades: [updatedTrade] });

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingStatusEvent.name,
            payload: { type: 'buy', status: 'success' },
        });
        expect(reportMock).toHaveBeenCalledTimes(1);
    });

    it('should handle trade with undefined status and not report analytics', () => {
        const buyTrade = getBuyTrade({ status: undefined });

        const { rerender } = setup([buyTrade]);

        expect(reportMock).not.toHaveBeenCalled();

        const updatedTrade = getBuyTrade({ status: 'SUCCESS' });
        rerender({ trades: [updatedTrade] });

        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should handle trade status transitions correctly', () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });

        const { rerender } = setup([exchangeTrade]);

        expect(reportMock).not.toHaveBeenCalled();

        const kycTrade = getExchangeTrade({ status: 'KYC' });
        rerender({ trades: [kycTrade] });
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingStatusEvent.name,
            payload: { type: 'exchange', status: 'kyc' },
        });
        expect(reportMock).toHaveBeenCalledTimes(1);

        const successTrade = getExchangeTrade({ status: 'SUCCESS' });
        rerender({ trades: [successTrade] });
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingStatusEvent.name,
            payload: { type: 'exchange', status: 'success' },
        });
        expect(reportMock).toHaveBeenCalledTimes(2);
    });

    it('should handle error statuses correctly', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { rerender } = setup([buyTrade]);

        expect(reportMock).not.toHaveBeenCalled();

        const errorTrade = getBuyTrade({ status: 'ERROR' });
        rerender({ trades: [errorTrade] });
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingStatusEvent.name,
            payload: { type: 'buy', status: 'error' },
        });
        expect(reportMock).toHaveBeenCalledTimes(1);
    });

    it('should maintain previous statuses across re-renders', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { rerender } = setup([buyTrade]);

        expect(reportMock).not.toHaveBeenCalled();

        const successTrade = getBuyTrade({ status: 'SUCCESS' });
        rerender({ trades: [successTrade] });
        expect(reportMock).toHaveBeenCalledTimes(1);

        rerender({ trades: [buyTrade] });
        expect(reportMock).toHaveBeenCalledTimes(2);
        expect(reportMock).toHaveBeenNthCalledWith(2, {
            type: events.tradingStatusEvent.name,
            payload: { type: 'buy', status: 'waiting' },
        });
    });

    it('should handle trade with all fallback keys undefined and not report analytics', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const tradeWithoutKeys = {
            ...buyTrade,
            key: undefined,
            data: {
                ...buyTrade.data,
                orderId: undefined,
                paymentId: undefined,
            },
        } as TradingTransaction;

        const { rerender } = setup([tradeWithoutKeys]);

        expect(reportMock).not.toHaveBeenCalled();

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

        const { rerender } = setup([buyTrade, exchangeTrade]);

        expect(reportMock).not.toHaveBeenCalled();

        rerender({ trades: [buyTrade] });
        expect(reportMock).not.toHaveBeenCalled();

        const updatedBuyTrade = getBuyTrade({ status: 'SUCCESS' });
        rerender({ trades: [updatedBuyTrade] });
        expect(reportMock).toHaveBeenCalledTimes(1);
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingStatusEvent.name,
            payload: { type: 'buy', status: 'success' },
        });
    });
});
