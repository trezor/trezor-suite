import { type Store, combineReducers } from '@reduxjs/toolkit';

import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type SendRootState,
    type SendState,
    initialWalletSettingsState,
    sendFormActions,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { getTranslation, localeReducer } from '@suite-native/intl';
import { type ExchangeFlowType, RootStackRoutes } from '@suite-native/navigation';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { createPrecomposedTxFinal, getWalletState } from '@suite-native/trading-fixtures';
import { type TradingRootState, tradingSlice } from '@suite-native/trading-state';
import {
    type NativeSendRootState,
    type UseTxValidityTimerParams,
    prepareSendFormReducer,
} from '@suite-native/transaction-management';
import TrezorConnect from '@trezor/connect';

import { useTradingOutputsReviewScreenControls } from './useTradingOutputsReviewScreenControls';
import { type TradingExchangeSignAndSendTransactionProps } from '../exchange/useExchangeFlow';
import { type TradingTransactionSignAndSendProps } from '../general/useTradingTransaction';

type State = TradingRootState & AccountsRootState & SendRootState & NativeSendRootState;

type RenderUseTradingOutputsReviewScreenControlsParams = {
    accountKey?: AccountKey;
    exchangeFlowType?: ExchangeFlowType;
    isDexExchange?: boolean;
};

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
const mockPopTo = jest.fn();
const mockUseOutputsReviewBackInterceptor = jest.fn();
const mockShowAlert = jest.fn();
type MockTxValidityTimerResult = {
    showTimer: boolean;
    secondsLeft: number;
    isPastDeadline: boolean;
    isBroadcasting: boolean;
    onRetry: () => void | Promise<void>;
    isRetryDisabled: boolean;
};

const mockUseTxValidityTimer = jest.fn(
    (_params: UseTxValidityTimerParams): MockTxValidityTimerResult => ({
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
        popTo: mockPopTo,
    }),
}));

jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    useOutputsReviewBackInterceptor: (onReviewCanceled: () => void) =>
        mockUseOutputsReviewBackInterceptor(onReviewCanceled),
    useTxValidityTimer: (params: UseTxValidityTimerParams) => mockUseTxValidityTimer(params),
}));

jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({
        showAlert: mockShowAlert,
    }),
}));

describe('useTradingOutputsReviewScreenControls', () => {
    let store: Store<State>;
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
        isDexExchange,
    }: RenderUseTradingOutputsReviewScreenControlsParams = {}) =>
        renderHookWithStoreProvider(
            () =>
                useTradingOutputsReviewScreenControls({
                    orderId: 'orderId',
                    accountKey:
                        accountKey ??
                        store
                            .getState()
                            .wallet.accounts.find((account: Account) => account.symbol === 'btc')!
                            .key,
                    signAndSendTransaction: mockSignAndSendTransaction,
                    resolveTransactionSendConsent: mockResolveTransactionSendConsent,
                    reportToAnalytics: mockReportToAnalytics,
                    isDexExchange,
                }),
            { services: { store } },
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
            }: UseTxValidityTimerParams) => ({
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

        it('should leave the timeout alert to the Solana timer', async () => {
            await renderUseTradingOutputsReviewScreenControls();
            const { onError } = mockSignAndSendTransaction.mock.calls[0]![0];

            await act(() => {
                onError({
                    type: 'sign-transaction-timeout',
                    error: { id: 'moduleTrading.tradingReviewOutputs.expiredAlert.title' },
                });
            });

            expect(mockShowAlert).not.toHaveBeenCalled();
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
                            symbol: asNetworkSymbol('btc'),
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
                ? { symbol: asNetworkSymbol('sol'), tx: 'signed-solana-tx' }
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

        it('should configure the DEX expiry alert for a fresh Solana transaction', async () => {
            const accountKey = createSolanaReviewStore();

            const { result } = await renderUseTradingOutputsReviewScreenControls({
                accountKey,
                isDexExchange: true,
            });

            expect(mockUseTxValidityTimer).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    networkType: 'solana',
                    createdTimestamp: expect.any(Number),
                    expiredAlertOptions: {
                        title: getTranslation(
                            'moduleTrading.tradingReviewOutputs.expiredAlert.title',
                        ),
                        description: getTranslation(
                            'moduleTrading.tradingReviewOutputs.expiredAlert.description',
                        ),
                        primaryButtonTitle: getTranslation(
                            'moduleTrading.tradingReviewOutputs.expiredAlert.button',
                        ),
                        secondaryButtonTitle: null,
                    },
                }),
            );
            expect(result.current.showTimer).toBe(true);
        });

        it('should use the default expiry alert for a non-DEX Solana transaction', async () => {
            const accountKey = createSolanaReviewStore();

            const { result } = await renderUseTradingOutputsReviewScreenControls({
                accountKey,
                isDexExchange: false,
            });

            expect(mockUseTxValidityTimer).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    networkType: 'solana',
                    expiredAlertOptions: undefined,
                }),
            );
            expect(result.current.showTimer).toBe(true);
        });

        it('should release the old consent and return to preview on DEX swap retry', async () => {
            const accountKey = createSolanaReviewStore();
            const { result } = await renderUseTradingOutputsReviewScreenControls({
                accountKey,
                isDexExchange: true,
            });

            await act(async () => {
                await result.current.onRetry();
            });

            expect(mockResolveTransactionSendConsent).toHaveBeenCalledWith(false);
            expect(mockTrezorConnectCancel).toHaveBeenCalledWith('tx-timeout');
            expect(store.getState().wallet.send.serializedTx).toBeUndefined();
            expect(mockPop).not.toHaveBeenCalled();
            expect(mockPopTo).toHaveBeenCalledWith(RootStackRoutes.TradingExchangePreview, {});
            expect(
                mockUseConfirmOnTrezorController.revealConfirmOnTrezorSheet,
            ).not.toHaveBeenCalled();
            expect(mockSignAndSendTransaction).not.toHaveBeenCalled();
        });

        it('should release the old consent and sign again on non-DEX swap retry', async () => {
            const accountKey = createSolanaReviewStore();
            const { result } = await renderUseTradingOutputsReviewScreenControls({
                accountKey,
                exchangeFlowType: 'swap',
                isDexExchange: false,
            });

            await act(async () => {
                await result.current.onRetry();
            });

            expect(mockResolveTransactionSendConsent).toHaveBeenCalledWith(false);
            expect(mockTrezorConnectCancel).toHaveBeenCalledWith('tx-timeout');
            expect(store.getState().wallet.send.serializedTx).toBeUndefined();
            expect(mockPop).not.toHaveBeenCalled();
            expect(mockPopTo).not.toHaveBeenCalled();
            expect(
                mockUseConfirmOnTrezorController.revealConfirmOnTrezorSheet,
            ).toHaveBeenCalledTimes(1);
            expect(mockSignAndSendTransaction).toHaveBeenCalledTimes(1);
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
