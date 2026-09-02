import React from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { type TradingTransaction } from '@suite-common/trading';
import { type NativeAnalyticsDep, events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { renderHook, renderHookWithBasicProvider } from '@suite-native/test-utils';
import { getBuyTrade, getExchangeTrade } from '@suite-native/trading-fixtures';

import { useTransactionStateChangeAnalyticsReporting } from './useTransactionStateChangeAnalyticsReporting';

type Props = { trades: TradingTransaction[] };
type ReportSpy = jest.SpyInstance;

const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(),
};

const useHookWithReportSpy = (trades: TradingTransaction[]) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);

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

    const setup = async (initialTrades: TradingTransaction[]) => {
        const hook = await renderHookWithBasicProvider(
            ({ trades }: Props) => useHookWithReportSpy(trades),
            { initialProps: { trades: initialTrades }, services },
        );

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

    it('should not report analytics when deviceTrades is empty', async () => {
        await setup([]);

        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should not report analytics when deviceTrades is undefined', async () => {
        await expect(
            renderHook(() => useTransactionStateChangeAnalyticsReporting(undefined as any)),
        ).rejects.toThrow('useServices must be used within a ServicesProvider');
    });

    it('should not report analytics on first render for buy trade', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        await setup([buyTrade]);

        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should report analytics for trade status change', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { rerender } = await setup([buyTrade]);

        const updatedBuyTrade = getBuyTrade({ status: 'SUCCESS' });
        await rerender({ trades: [updatedBuyTrade] });

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingStatusEvent.name,
            payload: { type: 'buy', status: 'success' },
        });
        expect(reportMock).toHaveBeenCalledTimes(1);
    });

    it('should not report analytics when status remains the same', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { rerender } = await setup([buyTrade]);

        await rerender({ trades: [buyTrade] });

        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should handle multiple trades with different status changes', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });

        const { rerender } = await setup([buyTrade, exchangeTrade]);

        expect(reportMock).not.toHaveBeenCalled();

        const updatedBuyTrade = getBuyTrade({ status: 'SUCCESS' });
        const updatedExchangeTrade = getExchangeTrade({ status: 'SUCCESS' });
        await rerender({ trades: [updatedBuyTrade, updatedExchangeTrade] });

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

    it('should handle trade with unknown key and not report analytics', async () => {
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

        const { rerender } = await setup([tradeWithoutKeys]);

        expect(reportMock).not.toHaveBeenCalled();

        const updatedTrade = {
            ...tradeWithoutKeys,
            data: { ...tradeWithoutKeys.data, status: 'SUCCESS' },
        } as TradingTransaction;
        await rerender({ trades: [updatedTrade] });

        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should handle trade with orderId as fallback key', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const tradeWithOrderId = { ...buyTrade, key: undefined } as TradingTransaction;

        const { rerender } = await setup([tradeWithOrderId]);

        expect(reportMock).not.toHaveBeenCalled();

        const updatedTrade = {
            ...tradeWithOrderId,
            data: { ...tradeWithOrderId.data, status: 'SUCCESS' },
        } as TradingTransaction;
        await rerender({ trades: [updatedTrade] });

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingStatusEvent.name,
            payload: { type: 'buy', status: 'success' },
        });
        expect(reportMock).toHaveBeenCalledTimes(1);
    });

    it('should handle trade with paymentId as fallback key', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const tradeWithPaymentId = {
            ...buyTrade,
            key: undefined,
            data: { ...buyTrade.data, orderId: undefined },
        } as TradingTransaction;

        const { rerender } = await setup([tradeWithPaymentId]);

        expect(reportMock).not.toHaveBeenCalled();

        const updatedTrade = {
            ...tradeWithPaymentId,
            data: { ...tradeWithPaymentId.data, status: 'SUCCESS' },
        } as TradingTransaction;
        await rerender({ trades: [updatedTrade] });

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingStatusEvent.name,
            payload: { type: 'buy', status: 'success' },
        });
        expect(reportMock).toHaveBeenCalledTimes(1);
    });

    it('should handle trade with undefined status and not report analytics', async () => {
        const buyTrade = getBuyTrade({ status: undefined });

        const { rerender } = await setup([buyTrade]);

        expect(reportMock).not.toHaveBeenCalled();

        const updatedTrade = getBuyTrade({ status: 'SUCCESS' });
        await rerender({ trades: [updatedTrade] });

        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should handle trade status transitions correctly', async () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });

        const { rerender } = await setup([exchangeTrade]);

        expect(reportMock).not.toHaveBeenCalled();

        const kycTrade = getExchangeTrade({ status: 'KYC' });
        await rerender({ trades: [kycTrade] });
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingStatusEvent.name,
            payload: { type: 'exchange', status: 'kyc' },
        });
        expect(reportMock).toHaveBeenCalledTimes(1);

        const successTrade = getExchangeTrade({ status: 'SUCCESS' });
        await rerender({ trades: [successTrade] });
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingStatusEvent.name,
            payload: { type: 'exchange', status: 'success' },
        });
        expect(reportMock).toHaveBeenCalledTimes(2);
    });

    it('should handle error statuses correctly', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { rerender } = await setup([buyTrade]);

        expect(reportMock).not.toHaveBeenCalled();

        const errorTrade = getBuyTrade({ status: 'ERROR' });
        await rerender({ trades: [errorTrade] });
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingStatusEvent.name,
            payload: { type: 'buy', status: 'error' },
        });
        expect(reportMock).toHaveBeenCalledTimes(1);
    });

    it('should maintain previous statuses across re-renders', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { rerender } = await setup([buyTrade]);

        expect(reportMock).not.toHaveBeenCalled();

        const successTrade = getBuyTrade({ status: 'SUCCESS' });
        await rerender({ trades: [successTrade] });
        expect(reportMock).toHaveBeenCalledTimes(1);

        await rerender({ trades: [buyTrade] });
        expect(reportMock).toHaveBeenCalledTimes(2);
        expect(reportMock).toHaveBeenNthCalledWith(2, {
            type: events.tradingStatusEvent.name,
            payload: { type: 'buy', status: 'waiting' },
        });
    });

    it('should handle trade with all fallback keys undefined and not report analytics', async () => {
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

        const { rerender } = await setup([tradeWithoutKeys]);

        expect(reportMock).not.toHaveBeenCalled();

        const updatedTrade = {
            ...tradeWithoutKeys,
            data: { ...tradeWithoutKeys.data, status: 'SUCCESS' },
        } as TradingTransaction;
        await rerender({ trades: [updatedTrade] });

        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should handle trades being removed from the list', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });

        const { rerender } = await setup([buyTrade, exchangeTrade]);

        expect(reportMock).not.toHaveBeenCalled();

        await rerender({ trades: [buyTrade] });
        expect(reportMock).not.toHaveBeenCalled();

        const updatedBuyTrade = getBuyTrade({ status: 'SUCCESS' });
        await rerender({ trades: [updatedBuyTrade] });
        expect(reportMock).toHaveBeenCalledTimes(1);
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingStatusEvent.name,
            payload: { type: 'buy', status: 'success' },
        });
    });
});
