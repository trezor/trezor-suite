import { type Store } from '@reduxjs/toolkit';
import { type ExchangeTrade } from 'invity-api';

import { selectTradingExchangeSelectedQuote, tradingExchangeActions } from '@suite-common/trading';
import { type AccountsRootState, sendFormActions } from '@suite-common/wallet-core';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { type ConfirmingScreenFlowType, RootStackRoutes } from '@suite-native/navigation';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { exchangeQuotes } from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';

import {
    type UseExchangeConfirmationNavigationParams,
    useExchangeConfirmationNavigation,
} from './useExchangeConfirmationNavigation';
import { createTradingTestStore } from '../../test-utils/tradingTestUtils';

type State = TradingRootState & AccountsRootState;

const testQuote = exchangeQuotes[0];

const mockNavigation = {
    popToTop: jest.fn(),
    push: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
}));

const mockAnalyticsReport = jest.fn();

describe('useExchangeConfirmationNavigation', () => {
    let store: Store<State>;

    const renderNavigation = async (initialProps: UseExchangeConfirmationNavigationParams) => {
        const services: NativeAnalyticsDep & { store: Store<State> } = {
            analytics: mockNativeAnalytics(mockAnalyticsReport),
            store,
        };

        return await renderHookWithStoreProvider(
            (props: UseExchangeConfirmationNavigationParams) =>
                useExchangeConfirmationNavigation(props),
            { initialProps, services },
        );
    };

    const saveQuote = async (quote: ExchangeTrade) => {
        await act(() => {
            store.dispatch(tradingExchangeActions.saveSelectedQuote(quote));
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        store = createTradingTestStore({ tradeType: 'exchange' });
        store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
    });

    it('does not navigate before the transaction is confirmed', async () => {
        await saveQuote({ ...testQuote, status: 'CONFIRM' });

        await renderNavigation({ flowType: 'approve', isConfirmed: false });

        expect(mockNavigation.popToTop).not.toHaveBeenCalled();
        expect(mockNavigation.push).not.toHaveBeenCalled();
    });

    it.each<ConfirmingScreenFlowType>(['approve', 'revoke-and-approve'])(
        'does not navigate a confirmed %s quote that is still pending or failed',
        async flowType => {
            await saveQuote({ ...testQuote, status: 'APPROVAL_PENDING' });

            await renderNavigation({ flowType, isConfirmed: true });

            await saveQuote({ ...testQuote, status: 'ERROR' });

            expect(mockNavigation.popToTop).not.toHaveBeenCalled();
            expect(mockNavigation.push).not.toHaveBeenCalled();
        },
    );

    it('opens the exchange preview once the confirmed approval quote is ready to swap', async () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch');

        await renderNavigation({ flowType: 'approve', isConfirmed: true });

        expect(mockNavigation.push).not.toHaveBeenCalled();

        await saveQuote({ ...testQuote, status: 'CONFIRM' });

        expect(mockNavigation.popToTop).toHaveBeenCalledTimes(1);
        expect(mockNavigation.push).toHaveBeenCalledTimes(1);
        expect(mockNavigation.push).toHaveBeenCalledWith(RootStackRoutes.TradingExchangePreview, {
            isApproved: true,
        });
        expect(dispatchSpy).toHaveBeenCalledWith(sendFormActions.dispose());
        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({
                step: 'approval-confirming',
                action: 'continue',
            }),
        });

        await saveQuote({ ...testQuote, status: 'CONFIRM' });

        expect(mockNavigation.push).toHaveBeenCalledTimes(1);
    });

    it('returns to the top and clears the quote when a revocation is confirmed', async () => {
        await renderNavigation({ flowType: 'revoke', isConfirmed: true });

        expect(mockNavigation.popToTop).toHaveBeenCalledTimes(1);
        expect(mockNavigation.push).not.toHaveBeenCalled();
        expect(selectTradingExchangeSelectedQuote(store.getState())).toBeUndefined();
        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({
                step: 'revoke-confirming',
                action: 'continue',
            }),
        });
    });

    it.each([
        { flowType: 'approve' as const, isRevoked: false },
        { flowType: 'revoke-and-approve' as const, isRevoked: true },
    ])(
        'opens the approval screen for a confirmed $flowType quote that still needs approval',
        async ({ flowType, isRevoked }) => {
            await saveQuote({
                ...testQuote,
                approvalType: 'ZERO',
                approvalSendTxHash: 'revoke-txid',
                status: 'APPROVAL_PENDING',
            });

            await renderNavigation({ flowType, isConfirmed: true });

            expect(mockNavigation.push).not.toHaveBeenCalled();

            await saveQuote({
                ...testQuote,
                approvalType: 'ZERO',
                approvalSendTxHash: 'revoke-txid',
                status: 'APPROVAL_REQ',
            });

            expect(mockNavigation.popToTop).toHaveBeenCalledTimes(1);
            expect(mockNavigation.push).toHaveBeenCalledWith(
                RootStackRoutes.TradingExchangeApproval,
                { isRevoked },
            );

            const persisted = selectTradingExchangeSelectedQuote(store.getState());
            expect(persisted?.approvalSendTxHash).toBeUndefined();
            expect(persisted?.approvalType).toBeUndefined();
            expect(persisted?.status).toBe('APPROVAL_REQ');
        },
    );
});
