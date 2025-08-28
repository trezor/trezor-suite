import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getBtcAccount } from '../../../__fixtures__/account';
import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { useExchangeFlow } from '../useExchangeFlow';

// Mock TrezorConnect to prevent errors during cleanup
jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    cancel: jest.fn(),
}));

// Mock the exchange thunks
jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    exchangeThunks: {
        confirmTradeThunk: (payload: unknown) => ({
            type: 'confirmTradeThunkMock',
            payload,
            unwrap: () => Promise.resolve(true),
        }),
        sendTransactionThunk: (payload: unknown) => ({
            type: 'sendTransactionThunkMock',
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

describe('useExchangeFlow', () => {
    const getMockAccounts = () => [getBtcAccount('btc1'), getBtcAccount('btc2')];

    const getInitializedStore = async () => {
        const tradingState = getInitializedTradingStateWithQuotes();
        // Add the required account keys to the exchange state
        tradingState.exchange.tradingAccountKey = 'btc1';
        tradingState.exchange.receiveAccountKey = 'btc2';
        // Set a selected quote so the hook can access selectedQuote.send
        tradingState.exchange.selectedQuote = tradingState.exchange.quotes[0];

        const preloadedState: PreloadedState = {
            wallet: {
                tradingNew: tradingState,
                accounts: getMockAccounts(),
            },
        };

        return await initStore(preloadedState);
    };

    const renderUseExchangeFlow = ({ store }: { store: TestStore }) =>
        renderHookWithStoreProviderAsync(() => useExchangeFlow(), { store });

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock the serializedTx selector to return a proper value
        jest.spyOn(require('@suite-common/wallet-core'), 'selectSendSerializedTx').mockReturnValue({
            type: 'bitcoin',
            txid: 'test-txid',
            hex: 'test-hex',
        });
    });

    describe('confirmTrade', () => {
        it('should call confirmTradeThunk when confirmTrade is called', async () => {
            const store = await getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');

            const { result } = await renderUseExchangeFlow({ store });

            const mockTrade = {
                exchange: 'test-exchange',
                orderId: 'test-order',
            };

            const mockAccount = {
                key: 'btc1',
                symbol: 'btc',
            };

            await act(async () => {
                await result.current.confirmTrade({
                    receiveAddress: 'test-address',
                    trade: mockTrade,
                    approvalFlow: false,
                    sendAccount: mockAccount,
                });
            });

            expect(dispatchSpy).toHaveBeenCalledWith({
                type: 'confirmTradeThunkMock',
                payload: {
                    returnUrl: expect.any(String),
                    receiveAddress: 'test-address',
                    account: expect.objectContaining({
                        key: 'btc1',
                        symbol: 'btc',
                    }),
                    extraField: undefined,
                    trade: mockTrade,
                    approvalFlow: false,
                    triggerAnalyticsTradeConfirmation: expect.any(Function),
                    processResponseData: expect.any(Function),
                    nextStep: expect.any(Function),
                },
                unwrap: expect.any(Function),
            });
        });
    });

    describe('composeRequest', () => {
        it('should call composeTradingTransactionThunk with correct parameters', async () => {
            const store = await getInitializedStore();
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

            const { result } = await renderUseExchangeFlow({ store });

            await act(async () => {
                await result.current.composeRequest('high');
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
                },
                unwrap: expect.any(Function),
            });
        });
    });

    describe('fetchFeesAndCompose', () => {
        it('should call updateFeeInfoThunk and then composeRequest', async () => {
            const store = await getInitializedStore();
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

            const { result } = await renderUseExchangeFlow({ store });

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

            // Then should call composeRequest
            expect(dispatchSpy).toHaveBeenCalledWith({
                type: 'composeTradingTransactionThunkMock',
                payload: {
                    tradeType: 'exchange',
                    account: expect.objectContaining({
                        key: 'btc1',
                    }),
                    network: expect.any(Object),
                    feeInfo: mockNetworkFeeInfo,
                    selectedFeeLevel: 'normal',
                },
                unwrap: expect.any(Function),
            });
        });
    });

    describe('signAndSendTransaction', () => {
        it('should call sendTransactionThunk with correct parameters', async () => {
            const store = await getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');

            const { result } = await renderUseExchangeFlow({ store });

            await act(async () => {
                await result.current.signAndSendTransaction();
            });

            expect(dispatchSpy).toHaveBeenCalledWith({
                type: 'sendTransactionThunkMock',
                payload: {
                    account: expect.objectContaining({ key: 'btc1' }),
                    trade: expect.any(Object),
                    returnUrl: expect.any(String),
                    setMaxOutputId: undefined,
                    decimals: expect.any(Number),
                    shouldSendInSats: expect.any(Boolean),
                    isSlip24Active: false,
                    nextStep: expect.any(Function),
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
            const store = await getInitializedStore();

            const { result } = await renderUseExchangeFlow({ store });

            // First, trigger the signAndSendTransaction to set up the promise
            const originalSendTransactionThunk =
                require('@suite-common/trading').exchangeThunks.sendTransactionThunk;
            require('@suite-common/trading').exchangeThunks.sendTransactionThunk = () => ({
                type: 'sendTransactionThunkMock',
                unwrap: () => Promise.resolve(true),
            });

            await act(async () => {
                await result.current.signAndSendTransaction();
            });

            // Now resolve the push consent
            act(() => {
                result.current.resolveConsent(true);
            });

            expect(result.current.isConsentRequested).toBe(false);

            // Restore the original mock
            require('@suite-common/trading').exchangeThunks.sendTransactionThunk =
                originalSendTransactionThunk;
        });
    });

    describe('getCommonFunctions', () => {
        it('should return undefined when no trade is provided and no selectedQuote', async () => {
            // Mock the selector to return undefined for selectedQuote
            const modifiedStore = await getInitializedStore();
            modifiedStore.getState().wallet.tradingNew.exchange.selectedQuote = undefined;

            const { result: modifiedResult } = await renderUseExchangeFlow({
                store: modifiedStore,
            });

            // The getCommonFunctions is called internally, but we can test its effect
            // by calling confirmTrade without a trade parameter
            const resultValue = await act(() =>
                modifiedResult.current.confirmTrade({
                    receiveAddress: 'test-address',
                    trade: undefined,
                    approvalFlow: false,
                    sendAccount: { key: 'btc1', symbol: 'btc' },
                }),
            );

            expect(resultValue).toBe(false);
        });
    });

    describe('useEffect cleanup', () => {
        it('should call TrezorConnect.cancel on unmount', async () => {
            const store = await getInitializedStore();
            const { unmount } = await renderUseExchangeFlow({ store });

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
