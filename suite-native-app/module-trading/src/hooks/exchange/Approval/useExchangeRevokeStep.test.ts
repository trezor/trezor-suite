import { type Store } from '@reduxjs/toolkit';

import { mockNetworksServices } from '@suite-common/networks/mocks';
import { selectTradingExchangeSelectedQuote, tradingExchangeActions } from '@suite-common/trading';
import { events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { useOnNavigationRemove } from '@suite-native/navigation';
import { act } from '@suite-native/test-utils-store';
import { mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';

import { useEvmApprovalFees } from './useEvmApprovalFees';
import { useExchangeRevokeStep } from './useExchangeRevokeStep';
import {
    createTradingTestStore,
    renderHookWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

const mockConfirmApproval = jest.fn().mockResolvedValue({});

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
    }),
}));

jest.mock('./useEvmApprovalFees', () => ({
    useEvmApprovalFees: jest.fn(),
}));

const mockedUseEvmApprovalFees = jest.mocked(useEvmApprovalFees);
const mockedUseOnNavigationRemove = jest.mocked(useOnNavigationRemove);
const mockAnalyticsReport = jest.fn();

type EvmApprovalFees = ReturnType<typeof useEvmApprovalFees>;

describe('useExchangeRevokeStep', () => {
    let store: Store<TradingRootState>;

    const mockFees = (overrides: Partial<EvmApprovalFees> = {}) => {
        mockedUseEvmApprovalFees.mockReturnValue({
            fee: '100000',
            isLoading: false,
            error: null,
            isFeeUnavailable: false,
            composeFees: jest.fn(),
            ...overrides,
        });
    };

    const renderRevokeStepHook = () =>
        renderHookWithTradingProvider(() => useExchangeRevokeStep(), {
            services: {
                analytics: mockNativeAnalytics(mockAnalyticsReport),
                store,
                networks: mockNetworksServices(),
            },
            tradeType: 'exchange',
        });

    beforeEach(() => {
        jest.clearAllMocks();
        mockFees();

        store = createTradingTestStore({ tradeType: 'exchange' });
        store.dispatch(tradingExchangeActions.saveSelectedQuote(mercuryoFixedWorstQuote));
    });

    it('confirms a zero approval once, composes zero fees and reports the visit', async () => {
        const { result } = await renderRevokeStepHook();

        expect(mockConfirmApproval).toHaveBeenCalledTimes(1);
        expect(mockConfirmApproval).toHaveBeenCalledWith(
            expect.objectContaining({ approvalType: 'ZERO' }),
        );
        expect(mockedUseEvmApprovalFees).toHaveBeenCalledWith({ approvalTypeOverride: 'ZERO' });
        expect(selectTradingExchangeSelectedQuote(store.getState())?.approvalType).toBe('ZERO');
        expect(result.current).toEqual(
            expect.objectContaining({ isRevokeReady: true, isDisabled: false }),
        );
        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({ step: 'revoke-preview', action: 'visit' }),
        });
    });

    it('is not ready while the fees are being composed', async () => {
        mockFees({ fee: undefined, isLoading: true });

        const { result } = await renderRevokeStepHook();

        expect(result.current.isRevokeReady).toBe(false);
        expect(result.current.isDisabled).toBe(false);
    });

    it('is disabled when the fee is unavailable', async () => {
        mockFees({ fee: undefined, isFeeUnavailable: true });

        const { result } = await renderRevokeStepHook();

        expect(result.current.isDisabled).toBe(true);
    });

    it('clears the selected quote on a removal attempt', async () => {
        await renderRevokeStepHook();

        await act(() =>
            mockedUseOnNavigationRemove.mock.calls
                .at(-1)?.[0]
                .onRemoveAttempt?.({ type: 'GO_BACK' }),
        );

        expect(selectTradingExchangeSelectedQuote(store.getState())).toBeUndefined();
    });
});
