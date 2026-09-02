import { asAccountDescriptor } from '@suite-common/wallet-types';
import { FeatureFlag } from '@suite-native/feature-flags';
import { type TestStore, act } from '@suite-native/test-utils-store';
import {
    getBtcAccount,
    getInitializedTradingStateWithQuotes,
} from '@suite-native/trading-fixtures';

import { useTradingTransaction } from './useTradingTransaction';
import {
    createTradingLightStore,
    renderHookWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

const mockComposeTradingTransaction = jest.fn();

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
jest.mock('../../thunks', () => ({
    signAndPushSendFormTransactionThunk: (payload: unknown) => ({
        type: 'signAndPushSendFormTransactionThunkMock',
        payload,
        unwrap: () => Promise.resolve(true),
    }),
}));

jest.mock('./useComposeTradingTransaction', () => ({
    useComposeTradingTransaction: () => ({
        composeTradingTransaction: mockComposeTradingTransaction,
    }),
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
}));

const btc1Account = getBtcAccount({ descriptor: asAccountDescriptor('btc1') });
const btc2Account = getBtcAccount({ descriptor: asAccountDescriptor('btc2') });

describe('useTradingTransaction', () => {
    const getMockAccounts = () => [btc1Account, btc2Account];

    const getInitializedStore = (featureFlags?: Partial<Record<FeatureFlag, boolean>>) => {
        const tradingState = getInitializedTradingStateWithQuotes();

        // Add the required account keys to the exchange state
        tradingState.exchange.tradingAccountKey = btc1Account.key;
        tradingState.exchange.receiveAccountKey = btc2Account.key;
        // Set a selected quote so the hook can access selectedQuote.send
        tradingState.exchange.selectedQuote = tradingState.exchange.quotes[0];

        return createTradingLightStore({
            tradeType: 'exchange',
            overrides: {
                wallet: {
                    trading: tradingState,
                    accounts: getMockAccounts(),
                },
                ...(featureFlags
                    ? {
                          featureFlags,
                          device: {
                              selectedDevice: {
                                  features: {
                                      major_version: 2,
                                      minor_version: 12,
                                      patch_version: 1,
                                  },
                              },
                          },
                      }
                    : {}),
            },
        });
    };

    const renderUseTradingTransaction = async ({ store }: { store: TestStore }) =>
        await renderHookWithTradingProvider(
            () => useTradingTransaction({ tradeType: 'exchange' }),
            {
                store,
            },
        );

    beforeEach(() => {
        jest.clearAllMocks();
        mockComposeTradingTransaction.mockResolvedValue(undefined);

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

    describe('composeTradingTransaction', () => {
        it('should call composeTradingTransaction', async () => {
            const store = getInitializedStore();

            const { result } = await renderUseTradingTransaction({ store });

            await act(async () => {
                await result.current.composeTradingTransaction();
            });

            expect(mockComposeTradingTransaction).toHaveBeenCalledTimes(1);
        });
    });

    describe('signAndSendTransaction', () => {
        it('should call sendTransactionThunk with correct parameters', async () => {
            const store = getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const mockNextStep = jest.fn();

            const { result } = await renderUseTradingTransaction({ store });

            await act(async () => {
                await result.current.signAndSendTransaction({
                    nextStep: mockNextStep,
                    onError: jest.fn(),
                });
            });

            expect(dispatchSpy).toHaveBeenCalledWith({
                type: 'sendTransactionThunkMock',
                payload: {
                    account: expect.objectContaining({ key: btc1Account.key }),
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

        it('should pass isSlip24Active: true to sendTransactionThunk when the feature flag is on', async () => {
            const store = getInitializedStore({ [FeatureFlag.IsTradingSlip24Enabled]: true });
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const mockNextStep = jest.fn();

            const { result } = await renderUseTradingTransaction({ store });

            await act(async () => {
                await result.current.signAndSendTransaction({
                    nextStep: mockNextStep,
                    onError: jest.fn(),
                });
            });

            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'sendTransactionThunkMock',
                    payload: expect.objectContaining({ isSlip24Active: true }),
                }),
            );
        });
    });

    describe('resolveConsent', () => {
        it('should set isConsentRequested to false and resolve the promise', async () => {
            const store = getInitializedStore();

            const { result } = await renderUseTradingTransaction({ store });

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
            await act(() => {
                result.current.resolveTransactionSendConsent(true);
            });

            expect(result.current.isTransactionSendConsentRequested).toBe(false);

            // Restore the original mock
            require('@suite-common/trading').exchangeThunks.sendTransactionThunk =
                originalSendTransactionThunk;
        });
    });

    describe('useEffect cleanup', () => {
        it('should call TrezorConnect.cancel on unmount', async () => {
            const store = getInitializedStore();
            const { unmount } = await renderUseTradingTransaction({ store });

            // Get the mocked TrezorConnect.cancel function
            const TrezorConnect = require('@trezor/connect');
            const mockCancel = TrezorConnect.cancel;

            // Unmount the component to trigger the cleanup useEffect
            await unmount();

            // Verify that TrezorConnect.cancel was called
            expect(mockCancel).toHaveBeenCalled();
        });
    });
});
