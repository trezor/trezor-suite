import { sendFormActions } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { act } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import {
    TestStore,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils/store';
import { getWalletState } from '@suite-native/trading-fixtures';
import { transactionManagementActions } from '@suite-native/transaction-management';

import { TradingExchangeSignAndSendTransactionProps } from '../../exchange/useExchangeFlow';
import { useTradingOutputsReviewScreenControls } from '../useTradingOutputsReviewScreenControls';

const mockReportToAnalytics = jest.fn();

const mockSignAndSendTransaction = jest.fn(() => Promise.resolve(true));

const mockUseConfirmOnTrezorController = {
    confirmOnTrezorRef: { current: null },
    closeSheet: jest.fn(),
};

const mockPopToTop = jest.fn();
const mockPop = jest.fn();
const mockUseOutputsReviewBackInterceptor = jest.fn();
const mockShowAlert = jest.fn();

jest.mock('@suite-native/confirm-on-trezor', () => ({
    ...jest.requireActual('@suite-native/confirm-on-trezor'),
    useConfirmOnTrezorController: () => mockUseConfirmOnTrezorController,
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        popToTop: mockPopToTop,
        pop: mockPop,
    }),
}));

jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    useOutputsReviewBackInterceptor: (onReviewCanceled: () => void) =>
        mockUseOutputsReviewBackInterceptor(onReviewCanceled),
}));

jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({
        showAlert: mockShowAlert,
    }),
}));

describe('useTradingOutputsReviewScreenControls', () => {
    let store: TestStore;

    const renderUseTradingOutputsReviewScreenControls = () =>
        renderHookWithStoreProviderAsync(
            () =>
                useTradingOutputsReviewScreenControls({
                    orderId: 'orderId',
                    accountKey: 'btc-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
                    signAndSendTransaction: mockSignAndSendTransaction,
                    reportToAnalytics: mockReportToAnalytics,
                }),
            {
                store,
            },
        );

    beforeEach(() => {
        jest.clearAllMocks();
        store = initStore({ wallet: getWalletState({ tradeType: 'exchange' }) }).store;
    });

    it('should return confirmOnTrezorRef', async () => {
        const { result } = await renderUseTradingOutputsReviewScreenControls();

        expect(result.current.confirmOnTrezorRef).toBe(
            mockUseConfirmOnTrezorController.confirmOnTrezorRef,
        );
    });

    describe('without signed transaction', () => {
        it('should call signAndSendTransaction on mount', async () => {
            await renderUseTradingOutputsReviewScreenControls();

            expect(mockSignAndSendTransaction).toHaveBeenCalledTimes(1);
        });

        it('should not call closeSheet', async () => {
            await renderUseTradingOutputsReviewScreenControls();

            expect(mockUseConfirmOnTrezorController.closeSheet).not.toHaveBeenCalled();
        });

        it('should navigate to trade detail', async () => {
            await renderUseTradingOutputsReviewScreenControls();

            expect(mockSignAndSendTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    nextStep: expect.any(Function),
                }),
            );

            // call the nextStep callback to simulate thunk behavior
            act(() => {
                const { nextStep } = (
                    mockSignAndSendTransaction.mock.lastCall as unknown as [
                        TradingExchangeSignAndSendTransactionProps,
                    ]
                )[0];
                nextStep();
            });
            expect(mockPopToTop).toHaveBeenCalledTimes(1);
            expect(store.getState().wallet.trading.tradeOrderIdToBeOpened).toBe('orderId');
            expect(mockReportToAnalytics).toHaveBeenCalledWith('sign-and-send', 'continue');
        });

        it('should navigate to trade detail and report sell analytics', async () => {
            store = (await initStore({ wallet: getWalletState({ tradeType: 'sell' }) })).store;
            await renderUseTradingOutputsReviewScreenControls();

            expect(mockSignAndSendTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    nextStep: expect.any(Function),
                }),
            );

            // call the nextStep callback to simulate thunk behavior
            act(() => {
                const { nextStep } = (
                    mockSignAndSendTransaction.mock.lastCall as unknown as [
                        TradingExchangeSignAndSendTransactionProps,
                    ]
                )[0];
                nextStep();
            });
            expect(mockPopToTop).toHaveBeenCalledTimes(1);
            expect(store.getState().wallet.trading.tradeOrderIdToBeOpened).toBe('orderId');
            expect(mockReportToAnalytics).toHaveBeenLastCalledWith('sign-and-send', 'continue');
        });

        it('should display alert on thunk error', async () => {
            await renderUseTradingOutputsReviewScreenControls();

            expect(mockSignAndSendTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    nextStep: expect.any(Function),
                }),
            );

            // call the onError callback to simulate thunk behavior
            act(() => {
                const { onError } = (
                    mockSignAndSendTransaction.mock.lastCall as unknown as [
                        TradingExchangeSignAndSendTransactionProps,
                    ]
                )[0];
                onError({
                    type: 'sign-tx-error',
                    error: {
                        id: 'TR_ERROR',
                    },
                });
            });
            expect(mockShowAlert).toHaveBeenCalledTimes(1);
            expect(mockShowAlert).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Transaction failed' }),
            );
        });

        it('should offer pop and popToTop action on thunk error', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            await renderUseTradingOutputsReviewScreenControls();

            expect(mockSignAndSendTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    nextStep: expect.any(Function),
                }),
            );

            // call the onError callback to simulate thunk behavior
            act(() => {
                const { onError } = (
                    mockSignAndSendTransaction.mock.lastCall as unknown as [
                        TradingExchangeSignAndSendTransactionProps,
                    ]
                )[0];
                onError({
                    type: 'sign-tx-error',
                    error: {
                        id: 'TR_ERROR',
                    },
                });
            });

            act(() => {
                mockShowAlert.mock.calls[0][0].onPressPrimaryButton();
            });

            expect(mockPop).toHaveBeenCalledTimes(1);
            expect(dispatchSpy).toHaveBeenCalledWith(sendFormActions.dispose());
            expect(dispatchSpy).toHaveBeenCalledWith(transactionManagementActions.clearFeeLevels());
            expect(mockReportToAnalytics).toHaveBeenCalledWith('sign-and-send', 'retry');

            act(() => {
                mockShowAlert.mock.calls[0][0].onPressSecondaryButton();
            });
            expect(mockReportToAnalytics).toHaveBeenCalledWith('sign-and-send', 'cancel');

            expect(mockPopToTop).toHaveBeenCalledTimes(1);
        });
    });

    describe('with signed transaction', () => {
        beforeEach(() => {
            act(() => {
                store.dispatch(
                    sendFormActions.storeSignedTransaction({
                        serializedTx: {
                            symbol: 'btc',
                            tx: 'txid',
                        },
                    }),
                );
            });
        });

        it('should not call signAndSendTransaction', async () => {
            await renderUseTradingOutputsReviewScreenControls();

            expect(mockSignAndSendTransaction).not.toHaveBeenCalled();
        });

        it('should closeSheet', async () => {
            await renderUseTradingOutputsReviewScreenControls();

            expect(mockUseConfirmOnTrezorController.closeSheet).toHaveBeenCalledTimes(1);
        });
    });

    describe('useOutputsReviewBackInterceptor', () => {
        it('should be initialized with popToTop navigation callback and report cancel for exchange', async () => {
            await renderUseTradingOutputsReviewScreenControls();

            act(() => {
                const onReviewCanceled = mockUseOutputsReviewBackInterceptor.mock.lastCall?.[0];
                onReviewCanceled();
            });

            expect(mockPopToTop).toHaveBeenCalledTimes(1);
            expect(mockReportToAnalytics).toHaveBeenCalledWith('sign-and-send', 'cancel');
        });

        it('should report cancel for sell', async () => {
            store = (await initStore({ wallet: getWalletState({ tradeType: 'sell' }) })).store;
            await renderUseTradingOutputsReviewScreenControls();

            act(() => {
                const onReviewCanceled = mockUseOutputsReviewBackInterceptor.mock.lastCall?.[0];
                onReviewCanceled();
            });

            expect(mockPopToTop).toHaveBeenCalledTimes(1);
            expect(mockReportToAnalytics).toHaveBeenLastCalledWith('sign-and-send', 'cancel');
        });
    });

    it('should report visit to analytics on mount for exchange', async () => {
        await renderUseTradingOutputsReviewScreenControls();

        expect(mockReportToAnalytics).toHaveBeenCalledWith('sign-and-send', 'visit');
    });
});
