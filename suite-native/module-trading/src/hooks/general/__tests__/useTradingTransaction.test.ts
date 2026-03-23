import { type AccountKey } from '@suite-common/wallet-types';
import {
    type PreloadedState,
    type TestStore,
    act,
    initStore,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils';
import {
    getBtcAccount,
    getInitializedTradingStateWithQuotes,
} from '@suite-native/trading-fixtures';

import { useTradingTransaction } from '../useTradingTransaction';

// Mock TrezorConnect to prevent errors during cleanup
jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    cancel: jest.fn(),
}));

// Mock the exchange thunks
jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    exchangeThunks: {
        sendTransactionThunk: (payload: unknown) => ({
            type: 'sendTransactionThunkMock',
            payload,
            unwrap: () => Promise.resolve(true),
        }),
    },
    sellThunks: {
        sendTransactionThunk: (payload: unknown) => ({
            type: 'sellSendTransactionThunkMock',
            payload,
            unwrap: () => Promise.resolve(true),
        }),
    },
}));

// Mock the thunks
jest.mock('../../../thunks', () => ({
    composeTradingTransactionThunk: (payload: unknown) => ({
        type: 'composeTradingTransactionThunkMock',
        payload,
        unwrap: () => Promise.resolve(true),
    }),
    signAndPushSendFormTransactionThunk: (payload: unknown) => ({
        type: 'signAndPushSendFormTransactionThunkMock',
        payload,
        unwrap: () => Promise.resolve(true),
    }),
}));

// Mock the wallet-core thunks
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    updateFeeInfoThunk: (payload: unknown) => ({
        type: 'updateFeeInfoThunkMock',
        payload,
        unwrap: () => Promise.resolve(true),
    }),
}));

describe('useTradingTransaction', () => {
    const getMockAccounts = () => [
        getBtcAccount(
            'btc1' as AccountKey, // Todo: create properly via `createAccountKey()`
        ),
        getBtcAccount(
            'btc2' as AccountKey, // Todo: create properly via `createAccountKey()`
        ),
    ];

    const getInitializedStore = () => {
        const tradingState = getInitializedTradingStateWithQuotes();

        // Add the required account keys to the exchange state
        tradingState.exchange.tradingAccountKey = 'btc1' as AccountKey; // Todo: create properly via `createAccountKey()`
        tradingState.exchange.receiveAccountKey = 'btc2' as AccountKey; // Todo: create properly via `createAccountKey()`
        // Set a selected quote so the hook can access selectedQuote.send
        tradingState.exchange.selectedQuote = tradingState.exchange.quotes[0];

        const preloadedState: PreloadedState = {
            wallet: {
                trading: tradingState,
                accounts: getMockAccounts(),
            },
        };

        return initStore(preloadedState).store;
    };

    const renderUseTradingTransaction = ({ store }: { store: TestStore }) =>
        renderHookWithStoreProvider(() => useTradingTransaction({ tradeType: 'exchange' }), {
            store,
        });

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock the serializedTx selector to return a proper value
        jest.spyOn(require('@suite-common/wallet-core'), 'selectSendSerializedTx').mockReturnValue({
            type: 'bitcoin',
            txid: 'test-txid',
            hex: 'test-hex',
        });

        // Mock the selectConvertedNetworkFeeInfo selector to return proper data by default
        jest.spyOn(
            require('@suite-common/wallet-core'),
            'selectConvertedNetworkFeeInfo',
        ).mockReturnValue({
            feePerUnit: '1000',
            feeLimit: '21000',
            estimatedFee: '21000000',
        });

        // Mock the selectDeepCopyOfFormDraft selector to return proper data by default
        jest.spyOn(
            require('@suite-common/wallet-core'),
            'selectDeepCopyOfFormDraft',
        ).mockReturnValue({
            selectedFee: 'normal',
            feePerUnit: '1000',
            feeLimit: '21000',
        });
    });

    describe('composeRequest', () => {
        it('should call composeTradingTransactionThunk with correct parameters', async () => {
            const store = getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');

            // Mock the networkFeeInfo selector to return proper data
            const mockNetworkFeeInfo = {
                feePerUnit: '1000',
                feeLimit: '21000',
                estimatedFee: '21000000',
            };

            // Mock the selectConvertedNetworkFeeInfo selector
            jest.spyOn(
                require('@suite-common/wallet-core'),
                'selectConvertedNetworkFeeInfo',
            ).mockReturnValue(mockNetworkFeeInfo);

            const { result } = renderUseTradingTransaction({ store });

            await act(async () => {
                await result.current.composeRequest({
                    selectedFeeLevel: 'high',
                    feePerUnit: '2000',
                    feeLimit: '25000',
                });
            });

            expect(dispatchSpy).toHaveBeenCalledWith({
                type: 'composeTradingTransactionThunkMock',
                payload: {
                    tradeType: 'exchange',
                    account: expect.objectContaining({
                        key: 'btc1',
                    }),
                    network: expect.any(Object),
                    feeInfo: mockNetworkFeeInfo,
                    selectedFeeLevel: 'high',
                    feePerUnit: '2000',
                    feeLimit: '25000',
                },
                unwrap: expect.any(Function),
            });
        });

        it('should call composeTradingTransactionThunk with minimal parameters', async () => {
            const store = getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');

            // Mock the networkFeeInfo selector to return proper data
            const mockNetworkFeeInfo = {
                feePerUnit: '1000',
                feeLimit: '21000',
                estimatedFee: '21000000',
            };

            jest.spyOn(
                require('@suite-common/wallet-core'),
                'selectConvertedNetworkFeeInfo',
            ).mockReturnValue(mockNetworkFeeInfo);

            const { result } = renderUseTradingTransaction({ store });

            await act(async () => {
                await result.current.composeRequest({});
            });

            expect(dispatchSpy).toHaveBeenCalledWith({
                type: 'composeTradingTransactionThunkMock',
                payload: {
                    tradeType: 'exchange',
                    account: expect.objectContaining({
                        key: 'btc1',
                    }),
                    network: expect.any(Object),
                    feeInfo: mockNetworkFeeInfo,
                    selectedFeeLevel: undefined,
                    feePerUnit: undefined,
                    feeLimit: undefined,
                },
                unwrap: expect.any(Function),
            });
        });
    });

    describe('fetchFeesAndCompose', () => {
        it('should call updateFeeInfoThunk and then composeRequest with draft fee values', async () => {
            const store = getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');

            // Mock the networkFeeInfo selector to return proper data
            const mockNetworkFeeInfo = {
                feePerUnit: '1000',
                feeLimit: '21000',
                estimatedFee: '21000000',
            };

            jest.spyOn(
                require('@suite-common/wallet-core'),
                'selectConvertedNetworkFeeInfo',
            ).mockReturnValue(mockNetworkFeeInfo);

            // Mock the selectDeepCopyOfFormDraft selector to return draft fee values
            jest.spyOn(
                require('@suite-common/wallet-core'),
                'selectDeepCopyOfFormDraft',
            ).mockReturnValue({
                selectedFee: 'high',
                feePerUnit: '5000',
                feeLimit: '30000',
            });

            const { result } = renderUseTradingTransaction({ store });

            await act(async () => {
                await result.current.fetchFeesAndCompose();
            });

            // Should call updateFeeInfoThunk first
            expect(dispatchSpy).toHaveBeenCalledWith({
                type: 'updateFeeInfoThunkMock',
                payload: {
                    networkSymbol: 'btc',
                },
                unwrap: expect.any(Function),
            });

            // Then should call composeRequest with draft fee values
            expect(dispatchSpy).toHaveBeenCalledWith({
                type: 'composeTradingTransactionThunkMock',
                payload: {
                    tradeType: 'exchange',
                    account: expect.objectContaining({
                        key: 'btc1',
                    }),
                    network: expect.any(Object),
                    feeInfo: mockNetworkFeeInfo,
                    selectedFeeLevel: 'high',
                    feePerUnit: '5000',
                    feeLimit: '30000',
                },
                unwrap: expect.any(Function),
            });
        });

        it('should handle undefined draft values', async () => {
            const store = getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');

            // Mock the networkFeeInfo selector to return proper data
            const mockNetworkFeeInfo = {
                feePerUnit: '1000',
                feeLimit: '21000',
                estimatedFee: '21000000',
            };

            jest.spyOn(
                require('@suite-common/wallet-core'),
                'selectConvertedNetworkFeeInfo',
            ).mockReturnValue(mockNetworkFeeInfo);

            // Mock the selectDeepCopyOfFormDraft selector to return undefined
            jest.spyOn(
                require('@suite-common/wallet-core'),
                'selectDeepCopyOfFormDraft',
            ).mockReturnValue(undefined);

            const { result } = renderUseTradingTransaction({ store });

            await act(async () => {
                await result.current.fetchFeesAndCompose();
            });

            // Should call updateFeeInfoThunk first
            expect(dispatchSpy).toHaveBeenCalledWith({
                type: 'updateFeeInfoThunkMock',
                payload: {
                    networkSymbol: 'btc',
                },
                unwrap: expect.any(Function),
            });

            // Then should call composeRequest with undefined values
            expect(dispatchSpy).toHaveBeenCalledWith({
                type: 'composeTradingTransactionThunkMock',
                payload: {
                    tradeType: 'exchange',
                    account: expect.objectContaining({
                        key: 'btc1',
                    }),
                    network: expect.any(Object),
                    feeInfo: mockNetworkFeeInfo,
                    selectedFeeLevel: undefined,
                    feePerUnit: undefined,
                    feeLimit: undefined,
                },
                unwrap: expect.any(Function),
            });
        });
    });

    describe('signAndSendTransaction', () => {
        it('should call sendTransactionThunk with correct parameters', async () => {
            const store = getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const mockNextStep = jest.fn();

            const { result } = renderUseTradingTransaction({ store });

            await act(async () => {
                await result.current.signAndSendTransaction({
                    nextStep: mockNextStep,
                    onError: jest.fn(),
                });
            });

            expect(dispatchSpy).toHaveBeenCalledWith({
                type: 'sendTransactionThunkMock',
                payload: {
                    account: expect.objectContaining({ key: 'btc1' }),
                    trade: expect.any(Object),
                    returnUrl: '',
                    setMaxOutputId: undefined,
                    decimals: expect.any(Number),
                    shouldSendInSats: expect.any(Boolean),
                    isSlip24Active: false,
                    nextStep: mockNextStep,
                    processResponseData: expect.any(Function),
                    triggerAnalyticsTradeConfirmation: expect.any(Function),
                    signAndPushSendFormTransaction: expect.any(Function),
                },
                unwrap: expect.any(Function),
            });
        });
    });

    describe('resolveConsent', () => {
        it('should set isConsentRequested to false and resolve the promise', async () => {
            const store = getInitializedStore();

            const { result } = renderUseTradingTransaction({ store });

            // First, trigger the signAndSendTransaction to set up the promise
            const originalSendTransactionThunk =
                require('@suite-common/trading').exchangeThunks.sendTransactionThunk;
            require('@suite-common/trading').exchangeThunks.sendTransactionThunk = () => ({
                type: 'sendTransactionThunkMock',
                unwrap: () => Promise.resolve(true),
            });

            await act(async () => {
                await result.current.signAndSendTransaction({
                    nextStep: jest.fn(),
                    onError: jest.fn(),
                });
            });

            // Now resolve the push consent
            act(() => {
                result.current.resolveTransactionSendConsent(true);
            });

            expect(result.current.isTransactionSendConsentRequested).toBe(false);

            // Restore the original mock
            require('@suite-common/trading').exchangeThunks.sendTransactionThunk =
                originalSendTransactionThunk;
        });
    });

    describe('useEffect cleanup', () => {
        it('should call TrezorConnect.cancel on unmount', () => {
            const store = getInitializedStore();
            const { unmount } = renderUseTradingTransaction({ store });

            // Get the mocked TrezorConnect.cancel function
            const TrezorConnect = require('@trezor/connect');
            const mockCancel = TrezorConnect.cancel;

            // Unmount the component to trigger the cleanup useEffect
            unmount();

            // Verify that TrezorConnect.cancel was called
            expect(mockCancel).toHaveBeenCalled();
        });
    });
});
