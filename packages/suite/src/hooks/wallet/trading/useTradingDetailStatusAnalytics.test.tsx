import { type PropsWithChildren } from 'react';

import { renderHook } from '@testing-library/react';

import { events } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { ServicesProvider } from '@suite-common/dependency-injection';

import { useTradingDetailStatusAnalytics } from './useTradingDetailStatusAnalytics';

const mockReport = jest.fn();

type Props = Parameters<typeof useTradingDetailStatusAnalytics>[0];

const renderStatusAnalytics = (initialProps: Props) => {
    const services = { analytics: mockDesktopAnalytics(mockReport) };

    return renderHook((props: Props) => useTradingDetailStatusAnalytics(props), {
        initialProps,
        wrapper: ({ children }: PropsWithChildren) => (
            <ServicesProvider services={services}>{children}</ServicesProvider>
        ),
    });
};

describe('useTradingDetailStatusAnalytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('does not report the initial status', () => {
        renderStatusAnalytics({ tradeType: 'sell', tradeStatus: 'PENDING', statusStep: 'pending' });

        expect(mockReport).not.toHaveBeenCalled();
    });

    it('reports once the status changes', () => {
        const { rerender } = renderStatusAnalytics({
            tradeType: 'sell',
            tradeStatus: 'PENDING',
            statusStep: 'pending',
        });

        rerender({ tradeType: 'sell', tradeStatus: 'SUCCESS', statusStep: 'success' });

        expect(mockReport).toHaveBeenCalledTimes(1);
        expect(mockReport).toHaveBeenCalledWith({
            type: events.tradeStatusEvent.name,
            payload: { type: 'sell', status: 'success' },
        });
    });

    it('does not report when the status stays the same', () => {
        const { rerender } = renderStatusAnalytics({
            tradeType: 'buy',
            tradeStatus: 'APPROVAL_PENDING',
            statusStep: 'processing',
        });

        rerender({ tradeType: 'buy', tradeStatus: 'APPROVAL_PENDING', statusStep: 'processing' });

        expect(mockReport).not.toHaveBeenCalled();
    });

    it('does not report a status the detail has no step for', () => {
        const { rerender } = renderStatusAnalytics({
            tradeType: 'buy',
            tradeStatus: 'SUBMITTED',
            statusStep: 'waiting',
        });

        rerender({ tradeType: 'buy', tradeStatus: 'REQUESTING', statusStep: undefined });

        expect(mockReport).not.toHaveBeenCalled();
    });
});
