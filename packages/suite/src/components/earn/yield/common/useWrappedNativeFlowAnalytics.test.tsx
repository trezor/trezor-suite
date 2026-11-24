import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { events } from '@suite-common/analytics';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';
import { mock } from '@trezor/dependency-injection';
import { type WithServices } from '@trezor/redux-utils';

import { useWrappedNativeFlowAnalytics } from './useWrappedNativeFlowAnalytics';
import { type MockSuiteState, mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

const mockReport = mock<DesktopAnalyticsDep['analytics']['report']>();

type Props = Parameters<typeof useWrappedNativeFlowAnalytics>[0];

const pendingWrap: Props = {
    flowType: 'wrap',
    status: 'pending',
    txid: '0xbroadcast',
    networkSymbol: 'eth',
};

const renderFlowAnalytics = (
    initialProps: Props,
    device = { connected: true, available: true },
) => {
    const { services } = createTestCompositionRoot<
        WithServices<DesktopAnalyticsDep>,
        MockSuiteState
    >({
        preloadedState: {
            ...mockInitialAppState,
            device: {
                ...mockInitialAppState.device,
                selectedDevice: mockSuiteDevice(device),
            },
        },
        services: () => ({ analytics: mockDesktopAnalytics(mockReport) }),
    });

    return renderHookWithStoreProvider(useWrappedNativeFlowAnalytics, { initialProps, services });
};

describe('useWrappedNativeFlowAnalytics', () => {
    beforeEach(() => jest.clearAllMocks());

    it.each([
        { connected: true, available: true, expectedStatus: 'connected' },
        { connected: false, available: false, expectedStatus: 'disconnected' },
        { connected: true, available: false, expectedStatus: 'unavailable' },
    ])('reports the connection state before the device guard ($connected/$available)', device => {
        const { result } = renderFlowAnalytics(
            { ...pendingWrap, status: null, txid: null },
            device,
        );

        act(() => result.current.reportSubmit());

        expect(mockReport).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    deviceStatus: device.expectedStatus,
                }),
            }),
        );
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
            ([event]) =>
                event.type === events.yieldWrapEvent.name && event.payload.type === 'success',
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
            ([event]) =>
                event.type === events.yieldWrapEvent.name && event.payload.type === 'leftPending',
        );
        expect(leftPendingReports).toHaveLength(0);
    });

    it.each(['wrap', 'unwrap'] as const)(
        'reports a new %s transaction even if its resolved status is unchanged',
        flowType => {
            const props: Props = { ...pendingWrap, flowType, status: 'confirmed' };
            const { rerender } = renderFlowAnalytics(props);

            rerender({ ...props, txid: '0xsecond-broadcast' });

            expect(mockReport).toHaveBeenCalledTimes(2);
            expect(mockReport).toHaveBeenLastCalledWith({
                type: `yield/${flowType}`,
                payload: expect.objectContaining({ type: 'success' }),
            });
        },
    );

    it.each(['wrap', 'unwrap'] as const)(
        'does not report a %s resolution without a broadcast transaction',
        flowType => {
            const { unmount } = renderFlowAnalytics({
                ...pendingWrap,
                flowType,
                status: 'confirmed',
                txid: null,
            });

            unmount();

            expect(mockReport).not.toHaveBeenCalled();
        },
    );
});
