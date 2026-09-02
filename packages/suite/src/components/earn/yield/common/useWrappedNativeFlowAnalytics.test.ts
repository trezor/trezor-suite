import { act, renderHook } from '@testing-library/react';

import { events } from '@suite-common/analytics';

import { useWrappedNativeFlowAnalytics } from './useWrappedNativeFlowAnalytics';

const mockReport = jest.fn();

// The reference must be stable across renders, or the resolution/leftPending effects re-bind.
jest.mock('@suite-common/dependency-injection', () => {
    const analytics = { report: (...args: unknown[]) => mockReport(...args) };

    return { useServices: () => ({ analytics }) };
});

jest.mock('@suite/analytics', () => ({ selectDesktopAnalyticsDep: () => ({}) }));

type Props = Parameters<typeof useWrappedNativeFlowAnalytics>[0];

const pendingWrap: Props = {
    flowType: 'wrap',
    status: 'pending',
    txid: '0xbroadcast',
    networkSymbol: 'eth',
};

const renderFlowAnalytics = (initialProps: Props) =>
    renderHook((props: Props) => useWrappedNativeFlowAnalytics(props), { initialProps });

describe('useWrappedNativeFlowAnalytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('reportSubmit fires the submit event', () => {
        const { result } = renderFlowAnalytics({
            flowType: 'wrap',
            status: null,
            txid: null,
            networkSymbol: 'eth',
        });

        act(() => result.current.reportSubmit());

        expect(mockReport).toHaveBeenCalledWith(
            expect.objectContaining({
                type: events.yieldWrapEvent.name,
                payload: expect.objectContaining({
                    type: 'submit',
                    action: 'continue',
                    networkSymbol: 'eth',
                }),
            }),
        );
    });

    it.each([
        ['wrap', 'wrap-max'],
        ['unwrap', 'unwrap-max'],
    ] as const)('reportMaxClick fires %s-max on the interaction event', (flowType, element) => {
        const { result } = renderFlowAnalytics({
            flowType,
            status: null,
            txid: null,
            networkSymbol: 'eth',
        });

        act(() => result.current.reportMaxClick());

        expect(mockReport).toHaveBeenCalledWith({
            type: events.yieldInteractionEvent.name,
            payload: { element, networkSymbol: 'eth' },
        });
    });

    it('reports success with a duration when the broadcast confirms', () => {
        const { rerender } = renderFlowAnalytics(pendingWrap);

        expect(mockReport).not.toHaveBeenCalled();

        rerender({ ...pendingWrap, status: 'confirmed' });

        expect(mockReport).toHaveBeenCalledWith(
            expect.objectContaining({
                type: events.yieldWrapEvent.name,
                payload: expect.objectContaining({
                    type: 'success',
                    action: 'continue',
                    networkSymbol: 'eth',
                    durationMs: expect.any(Number),
                }),
            }),
        );
    });

    it('reports an on-chain-failure error when the broadcast fails', () => {
        const { rerender } = renderFlowAnalytics(pendingWrap);

        rerender({ ...pendingWrap, status: 'failed' });

        expect(mockReport).toHaveBeenCalledWith(
            expect.objectContaining({
                type: events.yieldWrapEvent.name,
                payload: expect.objectContaining({
                    type: 'error',
                    errorMessage: 'on-chain-failure',
                    durationMs: expect.any(Number),
                }),
            }),
        );
    });

    it('reports the resolution only once', () => {
        const { rerender } = renderFlowAnalytics(pendingWrap);

        rerender({ ...pendingWrap, status: 'confirmed' });
        rerender({ ...pendingWrap, status: 'confirmed' });

        const successReports = mockReport.mock.calls.filter(
            ([event]) => event.payload.type === 'success',
        );
        expect(successReports).toHaveLength(1);
    });

    it('reports leftPending when unmounted while still pending', () => {
        const { unmount } = renderFlowAnalytics({ ...pendingWrap, flowType: 'unwrap' });

        unmount();

        expect(mockReport).toHaveBeenCalledWith(
            expect.objectContaining({
                type: events.yieldUnwrapEvent.name,
                payload: expect.objectContaining({
                    type: 'leftPending',
                    action: 'continue',
                    networkSymbol: 'eth',
                }),
            }),
        );
    });

    it('does not report leftPending when the flow already resolved', () => {
        const { rerender, unmount } = renderFlowAnalytics(pendingWrap);

        rerender({ ...pendingWrap, status: 'confirmed' });
        unmount();

        const leftPendingReports = mockReport.mock.calls.filter(
            ([event]) => event.payload.type === 'leftPending',
        );
        expect(leftPendingReports).toHaveLength(0);
    });
});
