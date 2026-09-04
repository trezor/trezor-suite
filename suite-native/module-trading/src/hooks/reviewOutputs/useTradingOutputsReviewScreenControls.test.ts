import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type SendState,
    initialWalletSettingsState,
    sendFormActions,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { localeReducer } from '@suite-native/intl';
import { type ExchangeFlowType } from '@suite-native/navigation';
import {
    type TestStore,
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { createPrecomposedTxFinal, getWalletState } from '@suite-native/trading-fixtures';
import { tradingSlice } from '@suite-native/trading-state';
import { prepareSendFormReducer } from '@suite-native/transaction-management';
import TrezorConnect from '@trezor/connect';

import { useTradingOutputsReviewScreenControls } from './useTradingOutputsReviewScreenControls';
import { type TradingExchangeSignAndSendTransactionProps } from '../exchange/useExchangeFlow';
import { type TradingTransactionSignAndSendProps } from '../general/useTradingTransaction';

const btcSymbol = asNetworkSymbol('btc');
const solSymbol = asNetworkSymbol('sol');

const mockReportToAnalytics = jest.fn();
const mockResolveTransactionSendConsent = jest.fn();

const mockSignAndSendTransaction = jest.fn<Promise<boolean>, [TradingTransactionSignAndSendProps]>(
    () => Promise.resolve(true),
);

const mockUseConfirmOnTrezorController = {
    confirmOnTrezorRef: { current: null },
    closeSheet: jest.fn(),
    revealConfirmOnTrezorSheet: jest.fn(),
};

const mockPopToTop = jest.fn();
const mockPop = jest.fn();
const mockUseOutputsReviewBackInterceptor = jest.fn();
const mockShowAlert = jest.fn();
type MockTxValidityTimerParams = {
    networkType?: string;
    createdTimestamp: number;
    isBroadcasting: boolean;
    onRetry: () => void | Promise<void>;
};

type MockTxValidityTimerResult = {
    showTimer: boolean;
    secondsLeft: number;
    isPastDeadline: boolean;
    isBroadcasting: boolean;
    onRetry: () => void | Promise<void>;
    isRetryDisabled: boolean;
};

const mockUseTxValidityTimer = jest.fn(
    (_params: MockTxValidityTimerParams): MockTxValidityTimerResult => ({
        showTimer: false,
        secondsLeft: 0,
        isPastDeadline: false,
        isBroadcasting: false,
        onRetry: jest.fn(),
        isRetryDisabled: false,
    }),
);
let mockIsPastDeadline = false;

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/connect'),
    default: {
        cancel: jest.fn(),
    },
}));

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
    useTxValidityTimer: (params: MockTxValidityTimerParams) => mockUseTxValidityTimer(params),
}));

jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({
        showAlert: mockShowAlert,
    }),
}));

describe('useTradingOutputsReviewScreenControls', () => {
    let store: TestStore;
    const mockTrezorConnectCancel = TrezorConnect.cancel as jest.Mock;

    const reducer = {
        locale: localeReducer,
        wallet: combineReducers({
            settings: createStaticReducer(initialWalletSettingsState),
            accounts: createStaticReducer(getWalletState({ tradeType: 'exchange' }).accounts),
            send: prepareSendFormReducer({
                actionTypes: { storageLoad: mockActionType('storageLoad') },
                reducers: { storageLoadFormDrafts: mockReducer() },
            }),
            trading: tradingSlice.prepareReducer({
                actionTypes: { storageLoad: mockActionType('storageLoad') },
            }),
        }),
    } as const;

    const createTestStore = (
        tradeType: 'exchange' | 'sell' = 'exchange',
        sendOverrides: Partial<SendState> = {},
    ) => {
        const { settings, accounts, send, trading } = getWalletState({ tradeType });

        return createLightStore({
            reducer,
            preloadedState: {
                wallet: { settings, accounts, send: { ...send, ...sendOverrides }, trading },
            },
        });
    };

    const renderUseTradingOutputsReviewScreenControls = ({
        accountKey,
        exchangeFlowType = 'swap',
    }: {
        accountKey?: AccountKey;
        exchangeFlowType?: ExchangeFlowType;
    } = {}) =>
        renderHookWithStoreProvider(
            () =>
                useTradingOutputsReviewScreenControls({
                    orderId: 'orderId',
                    accountKey:
                        accountKey ??
                        store
                            .getState()
                            .wallet.accounts.find(
                                (account: Account) => account.symbol === btcSymbol,
                            )!.key,
                    signAndSendTransaction: mockSignAndSendTransaction,
                    resolveTransactionSendConsent: mockResolveTransactionSendConsent,
                    reportToAnalytics: mockReportToAnalytics,
                    exchangeFlowType,
                }),
            {
                store,
            },
        );

    beforeEach(() => {
        jest.clearAllMocks();
        mockIsPastDeadline = false;
        mockSignAndSendTransaction.mockResolvedValue(true);
        mockUseTxValidityTimer.mockImplementation(
            ({
                networkType,
                createdTimestamp,
                isBroadcasting,
                onRetry,
            }: MockTxValidityTimerParams) => ({
                showTimer: networkType === 'solana' && createdTimestamp > 0,
                secondsLeft: 30,
                isPastDeadline: mockIsPastDeadline,
                isBroadcasting,
                onRetry,
                isRetryDisabled: false,
            }),
        );
        store = createTestStore();
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
            await act(() => {
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
            store = createTestStore('sell');
            await renderUseTradingOutputsReviewScreenControls();

            expect(mockSignAndSendTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    nextStep: expect.any(Function),
                }),
            );

            // call the nextStep callback to simulate thunk behavior
            await act(() => {
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
            await act(() => {
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

        it('should retry signing without leaving the outputs review', async () => {
            await renderUseTradingOutputsReviewScreenControls();

            expect(mockSignAndSendTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    nextStep: expect.any(Function),
                }),
            );

            // call the onError callback to simulate thunk behavior
            await act(() => {
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

            await act(() => {
                mockShowAlert.mock.calls[0][0].onPressPrimaryButton();
            });

            expect(mockSignAndSendTransaction).toHaveBeenCalledTimes(2);
            expect(mockReportToAnalytics).toHaveBeenCalledWith('sign-and-send', 'retry');
        });

        it('should leave the flow when error alert is canceled', async () => {
            await renderUseTradingOutputsReviewScreenControls();

            await act(() => {
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

            await act(() => {
                mockShowAlert.mock.calls[0][0].onPressSecondaryButton();
            });
            expect(mockReportToAnalytics).toHaveBeenCalledWith('sign-and-send', 'cancel');

            expect(mockPopToTop).toHaveBeenCalledTimes(1);
        });
    });

    describe('with signed transaction', () => {
        beforeEach(async () => {
            await act(() => {
                store.dispatch(
                    sendFormActions.storeSignedTransaction({
                        serializedTx: {
                            symbol: btcSymbol,
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

    describe('Solana transaction validity', () => {
        const createSolanaReviewStore = (isSigned = true) => {
            const serializedTx = isSigned
                ? { symbol: solSymbol, tx: 'signed-solana-tx' }
                : undefined;

            store = createTestStore('exchange', {
                precomposedTx: createPrecomposedTxFinal({
                    createdTimestamp: Date.now() + 1_000,
                }),
                serializedTx,
            });

            return store
                .getState()
                .wallet.accounts.find((account: Account) => account.networkType === 'solana')!.key;
        };

        it('should configure the validity timer for a fresh Solana transaction', async () => {
            const accountKey = createSolanaReviewStore();

            const { result } = await renderUseTradingOutputsReviewScreenControls({ accountKey });

            expect(mockUseTxValidityTimer).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    networkType: 'solana',
                    createdTimestamp: expect.any(Number),
                }),
            );
            expect(result.current.showTimer).toBe(true);
        });

        it('should ignore the transaction timestamp for a sign-data flow', async () => {
            const accountKey = createSolanaReviewStore();

            await renderUseTradingOutputsReviewScreenControls({
                accountKey,
                exchangeFlowType: 'sign-data',
            });

            expect(mockUseTxValidityTimer).toHaveBeenLastCalledWith(
                expect.objectContaining({ createdTimestamp: 0 }),
            );
        });

        it('should release the old consent and sign again on retry', async () => {
            const accountKey = createSolanaReviewStore();
            const { result } = await renderUseTradingOutputsReviewScreenControls({ accountKey });

            await act(async () => {
                await result.current.onRetry();
            });

            expect(mockResolveTransactionSendConsent).toHaveBeenCalledWith(false);
            expect(mockTrezorConnectCancel).toHaveBeenCalledWith('tx-timeout');
            expect(
                mockUseConfirmOnTrezorController.revealConfirmOnTrezorSheet,
            ).toHaveBeenCalledTimes(1);
            expect(mockSignAndSendTransaction).toHaveBeenCalledTimes(1);
            expect(store.getState().wallet.send.serializedTx).toBeUndefined();
        });

        it('should start broadcasting only for a valid transaction', async () => {
            const accountKey = createSolanaReviewStore();
            const { result } = await renderUseTradingOutputsReviewScreenControls({ accountKey });

            await act(() => {
                result.current.handleSendTransaction();
            });

            expect(mockResolveTransactionSendConsent).toHaveBeenCalledWith(true);
            expect(result.current.isBroadcasting).toBe(true);
        });

        it('should not broadcast an expired transaction', async () => {
            mockIsPastDeadline = true;
            const accountKey = createSolanaReviewStore();
            const { result } = await renderUseTradingOutputsReviewScreenControls({ accountKey });

            await act(() => {
                result.current.handleSendTransaction();
            });

            expect(mockResolveTransactionSendConsent).not.toHaveBeenCalledWith(true);
            expect(result.current.isBroadcasting).toBe(false);
        });
    });

    describe('useOutputsReviewBackInterceptor', () => {
        it('should be initialized with popToTop navigation callback and report cancel for exchange', async () => {
            await renderUseTradingOutputsReviewScreenControls();

            await act(() => {
                const onReviewCanceled = mockUseOutputsReviewBackInterceptor.mock.lastCall?.[0];
                onReviewCanceled();
            });

            expect(mockPopToTop).toHaveBeenCalledTimes(1);
            expect(mockReportToAnalytics).toHaveBeenCalledWith('sign-and-send', 'cancel');
        });

        it('should report cancel for sell', async () => {
            store = createTestStore('sell');
            await renderUseTradingOutputsReviewScreenControls();

            await act(() => {
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
