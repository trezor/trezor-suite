import { type Store } from '@reduxjs/toolkit';

import { mockNetworksServices } from '@suite-common/networks/mocks';
import { selectTradingExchangeSelectedQuote, tradingExchangeActions } from '@suite-common/trading';
import { events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { useOnNavigationRemove } from '@suite-native/navigation';
import { act } from '@suite-native/test-utils-store';
import { mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';

import { type useEvmApprovalFees } from './useEvmApprovalFees';
import { useExchangeApprovalStep } from './useExchangeApprovalStep';
import {
    createTradingTestStore,
    renderHookWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

const mockConfirmApproval = jest.fn().mockResolvedValue({});
const mockOnApprovalTypeChange = jest.fn();

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useOnNavigationRemove: jest.fn(),
}));

jest.mock('./useApprovalFlow', () => ({
    useApprovalFlow: () => ({
        isReady: true,
        isConfirming: false,
        error: null,
        confirmApproval: mockConfirmApproval,
        onApprovalTypeChange: mockOnApprovalTypeChange,
    }),
}));

let mockEvmApprovalFees: Pick<
    ReturnType<typeof useEvmApprovalFees>,
    'fee' | 'isLoading' | 'error' | 'isFeeUnavailable'
>;

jest.mock('./useEvmApprovalFees', () => ({
    useEvmApprovalFees: () => ({ ...mockEvmApprovalFees, composeFees: jest.fn() }),
}));

const mockedUseOnNavigationRemove = jest.mocked(useOnNavigationRemove);
const mockAnalyticsReport = jest.fn();

describe('useExchangeApprovalStep', () => {
    let store: Store<TradingRootState>;

    const renderApprovalStepHook = (isRevoked: boolean | undefined) =>
        renderHookWithTradingProvider(() => useExchangeApprovalStep({ isRevoked }), {
            services: {
                analytics: mockNativeAnalytics(mockAnalyticsReport),
                store,
                networks: mockNetworksServices(),
            },
            tradeType: 'exchange',
        });

    beforeEach(() => {
        jest.clearAllMocks();
        mockEvmApprovalFees = {
            fee: '100000',
            isLoading: false,
            error: null,
            isFeeUnavailable: false,
        };

        store = createTradingTestStore({ tradeType: 'exchange' });
        store.dispatch(tradingExchangeActions.saveSelectedQuote(mercuryoFixedWorstQuote));
    });

    it('confirms a minimal approval once and reports the visit', async () => {
        const { result } = await renderApprovalStepHook(undefined);

        expect(mockConfirmApproval).toHaveBeenCalledTimes(1);
        expect(mockConfirmApproval).toHaveBeenCalledWith(
            expect.objectContaining({ approvalType: 'MINIMAL' }),
        );
        expect(result.current).toEqual(
            expect.objectContaining({
                quote: expect.objectContaining({ approvalType: 'MINIMAL' }),
                isApprovalReady: true,
                isDisabled: false,
            }),
        );
        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({ step: 'approval-preview', action: 'visit' }),
        });
    });

    it('resets the revoke approval type to minimal after a revoke', async () => {
        store.dispatch(
            tradingExchangeActions.saveSelectedQuote({
                ...mercuryoFixedWorstQuote,
                approvalType: 'ZERO',
            }),
        );

        await renderApprovalStepHook(true);

        expect(mockConfirmApproval).toHaveBeenCalledWith(
            expect.objectContaining({ approvalType: 'MINIMAL' }),
        );
    });

    it('keeps the selected approval type without a revoke', async () => {
        store.dispatch(
            tradingExchangeActions.saveSelectedQuote({
                ...mercuryoFixedWorstQuote,
                approvalType: 'INFINITE',
            }),
        );

        await renderApprovalStepHook(false);

        expect(mockConfirmApproval).toHaveBeenCalledWith(
            expect.objectContaining({ approvalType: 'INFINITE' }),
        );
    });

    it('is not ready while the fees are being composed', async () => {
        mockEvmApprovalFees = { ...mockEvmApprovalFees, fee: undefined, isLoading: true };

        const { result } = await renderApprovalStepHook(undefined);

        expect(result.current.isApprovalReady).toBe(false);
        expect(result.current.isDisabled).toBe(false);
    });

    it('is disabled when the fee is unavailable', async () => {
        mockEvmApprovalFees = { ...mockEvmApprovalFees, fee: undefined, isFeeUnavailable: true };

        const { result } = await renderApprovalStepHook(undefined);

        expect(result.current.isDisabled).toBe(true);
    });

    it('reports the approval type change', async () => {
        const { result } = await renderApprovalStepHook(undefined);

        await act(() => result.current.onApprovalTypeChange('INFINITE'));

        expect(mockOnApprovalTypeChange).toHaveBeenCalledWith('INFINITE');
        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({
                step: 'approval-preview',
                action: 'value_change',
            }),
        });
    });

    it('clears the selected quote on a removal attempt', async () => {
        await renderApprovalStepHook(undefined);

        await act(() =>
            mockedUseOnNavigationRemove.mock.calls
                .at(-1)?.[0]
                .onRemoveAttempt?.({ type: 'GO_BACK' }),
        );

        expect(selectTradingExchangeSelectedQuote(store.getState())).toBeUndefined();
    });
});
