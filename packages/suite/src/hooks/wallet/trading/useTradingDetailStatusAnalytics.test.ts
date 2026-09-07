import { renderHook } from '@testing-library/react';

import { events } from '@suite/analytics';

import { useTradingDetailStatusAnalytics } from './useTradingDetailStatusAnalytics';

const mockReport = jest.fn();

jest.mock('@suite-common/dependency-injection', () => {
    const analytics = { report: (...args: unknown[]) => mockReport(...args) };

    return { useServices: () => ({ analytics }) };
});

jest.mock('@suite/analytics', () => ({
    ...jest.requireActual('@suite/analytics'),
    selectDesktopAnalyticsDep: () => ({}),
}));

type Props = Parameters<typeof useTradingDetailStatusAnalytics>[0];

const renderStatusAnalytics = (initialProps: Props) =>
    renderHook((props: Props) => useTradingDetailStatusAnalytics(props), { initialProps });

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
