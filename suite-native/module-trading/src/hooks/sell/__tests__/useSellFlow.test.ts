import type { SellFiatTrade, SellFiatTradeResponse } from 'invity-api';

import { tradingSellActions } from '@suite-common/trading';
import type { sellThunks } from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { type TestStore, act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { banxaCreditCardSellQuote, verifiedBankAccount } from '@suite-native/trading-fixtures';

import { createTradingLightStore } from '../../../__tests__/tradingTestUtils';
import { useSellFlow } from '../useSellFlow';

// Store captured arguments for testing side effects (processResponseData callback)
let capturedHandleTradeArgs: Parameters<typeof sellThunks.handleTradeThunk>[0] | null = null;

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    sellThunks: {
        handleTradeThunk: (args: unknown) => {
            capturedHandleTradeArgs = args as typeof capturedHandleTradeArgs;

            return {
                type: 'handleTradeThunkMock',
                payload: args,
            };
        },
        confirmTradeThunk: (args: unknown) => ({
            type: 'confirmTradeThunkMock',
            payload: args,
        }),
    },
    sellUtils: {
        needToRegisterOrVerifyBankAccount: jest.fn(
            ({ quote }) =>
                // Mock logic: return true if exchange is 'banxa-sell' and quote has no quoteId
                quote?.exchange === 'banxa-sell' && !quote?.quoteId,
        ),
    },
}));

const mockOpenBrowserAsync = jest.fn();

jest.mock('expo-web-browser', () => {
    const originalModule = jest.requireActual('expo-web-browser');

    return {
        ...originalModule,
        openBrowserAsync: (...args: unknown[]) => mockOpenBrowserAsync(...args),
    };
});

jest.mock('../../general/useTradingTransaction', () => ({
    useTradingTransaction: () => ({
        txnErrorString: null,
        composeRequest: jest.fn(),
        fetchFeesAndCompose: jest.fn(),
        signAndSendTransaction: jest.fn(),
        serializedTx: undefined,
        resolveTransactionSendConsent: jest.fn(),
        isTransactionSendConsentRequested: false,
    }),
}));

const btc1AccountKey = 'btc-account-1' as AccountKey; // Todo: create properly via `createAccountKey()`

describe('useSellFlow', () => {
    let store: TestStore;

    const renderUseSellFlow = () =>
        renderHookWithStoreProvider(() => useSellFlow(), { store, providers: ['intl'] });

    beforeEach(() => {
        store = createTradingLightStore({ tradeType: 'sell' });

        capturedHandleTradeArgs = null;
        jest.clearAllMocks();

        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    describe('doSellTrade', () => {
        it('should dispatch handleTradeThunk with correct parameters', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const trade = banxaCreditCardSellQuote;

            // Set up required state
            act(() => {
                store.dispatch(tradingSellActions.setTradingAccountKey(btc1AccountKey));
                store.dispatch(tradingSellActions.saveSelectedQuote(trade));
            });

            const { result } = renderUseSellFlow();

            await act(async () => {
                await result.current.doSellTrade(trade);
            });

            // Verify dispatch was called with the thunk
            expect(dispatchSpy).toHaveBeenCalledWith({
                type: 'handleTradeThunkMock',
                payload: expect.objectContaining({
                    trade,
                    account: expect.objectContaining({
                        key: btc1AccountKey,
                    }),
                    returnUrl: expect.stringContaining('trezorsuite://trading'),
                    processResponseData: expect.any(Function),
                }),
            });
        });

        it('should not dispatch thunk if sendAccount is missing', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const trade = banxaCreditCardSellQuote;

            // Set up quote but not account
            act(() => {
                store.dispatch(tradingSellActions.saveSelectedQuote(trade));
                // Explicitly clear trading account key
                store.dispatch(tradingSellActions.setTradingAccountKey(undefined));
            });

            const { result } = renderUseSellFlow();

            await act(async () => {
                await result.current.doSellTrade(trade);
            });

            // Verify dispatch was NOT called with handleTradeThunk
            expect(dispatchSpy).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'handleTradeThunkMock',
                }),
            );
        });

        it('should dispatch thunk even when selectedQuote is not set (uses passed trade)', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const trade = banxaCreditCardSellQuote;

            // Set up account but not selectedQuote
            act(() => {
                store.dispatch(tradingSellActions.setTradingAccountKey(btc1AccountKey));
                store.dispatch(tradingSellActions.saveSelectedQuote(undefined));
            });

            const { result } = renderUseSellFlow();

            await act(async () => {
                await result.current.doSellTrade(trade);
            });

            // Should still work because trade is passed as parameter
            expect(dispatchSpy).toHaveBeenCalledWith({
                type: 'handleTradeThunkMock',
                payload: expect.objectContaining({
                    trade,
                }),
            });
        });
    });

    describe('confirmTrade', () => {
        it('should dispatch confirmTradeThunk with bank account and correct parameters', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const trade = banxaCreditCardSellQuote;
            const bankAccount = verifiedBankAccount;

            // Set up required state
            act(() => {
                store.dispatch(tradingSellActions.setTradingAccountKey(btc1AccountKey));
                store.dispatch(tradingSellActions.saveSelectedQuote(trade));
            });

            const { result } = renderUseSellFlow();

            await act(async () => {
                await result.current.confirmTrade(bankAccount);
            });

            // Verify dispatch was called
            expect(dispatchSpy).toHaveBeenCalledWith({
                type: 'confirmTradeThunkMock',
                payload: expect.objectContaining({
                    bankAccount,
                    account: expect.objectContaining({
                        key: btc1AccountKey,
                    }),
                    returnUrl: expect.stringContaining('trezorsuite://trading'),
                    triggerAnalyticsTradeConfirmation: expect.any(Function),
                    processResponseData: expect.any(Function),
                }),
            });
        });

        it('should not dispatch thunk if selectedQuote is missing', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const bankAccount = verifiedBankAccount;

            // Set up account but not quote
            act(() => {
                store.dispatch(tradingSellActions.setTradingAccountKey(btc1AccountKey));
                store.dispatch(tradingSellActions.saveSelectedQuote(undefined));
            });

            const { result } = renderUseSellFlow();

            await act(async () => {
                await result.current.confirmTrade(bankAccount);
            });

            expect(dispatchSpy).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'confirmTradeThunkMock',
                }),
            );
        });

        it('should not dispatch thunk if sendAccount is missing', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const trade = banxaCreditCardSellQuote;
            const bankAccount = verifiedBankAccount;

            // Set up quote but not account
            act(() => {
                store.dispatch(tradingSellActions.saveSelectedQuote(trade));
                store.dispatch(tradingSellActions.setTradingAccountKey(undefined));
            });

            const { result } = renderUseSellFlow();

            await act(async () => {
                await result.current.confirmTrade(bankAccount);
            });

            expect(dispatchSpy).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'confirmTradeThunkMock',
                }),
            );
        });
    });

    describe('doBankAccountVerificationCheck', () => {
        it('should call doSellTrade when needToRegisterOrVerifyBankAccount returns true', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const trade = {
                ...banxaCreditCardSellQuote,
                exchange: 'banxa-sell',
                quoteId: undefined,
            };

            act(() => {
                store.dispatch(tradingSellActions.setTradingAccountKey(btc1AccountKey));
                store.dispatch(tradingSellActions.saveSelectedQuote(trade));
            });

            const { result } = renderUseSellFlow();

            await act(async () => {
                await result.current.doBankAccountVerificationCheck();
            });

            expect(dispatchSpy).toHaveBeenCalledWith({
                type: 'handleTradeThunkMock',
                payload: expect.objectContaining({
                    trade,
                }),
            });
        });

        it('should call doSellTrade when quoteId is empty', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const trade = { ...banxaCreditCardSellQuote, quoteId: '' };

            act(() => {
                store.dispatch(tradingSellActions.setTradingAccountKey(btc1AccountKey));
                store.dispatch(tradingSellActions.saveSelectedQuote(trade));
            });

            const { result } = renderUseSellFlow();

            await act(async () => {
                await result.current.doBankAccountVerificationCheck();
            });

            expect(dispatchSpy).toHaveBeenCalledWith({
                type: 'handleTradeThunkMock',
                payload: expect.objectContaining({
                    trade,
                }),
            });
        });

        it('should not call doSellTrade when verification is not needed', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            // Use a trade with a quoteId to avoid triggering doSellTrade
            const trade = { ...banxaCreditCardSellQuote, quoteId: 'test-quote-id' };

            act(() => {
                store.dispatch(tradingSellActions.setTradingAccountKey(btc1AccountKey));
                store.dispatch(tradingSellActions.saveSelectedQuote(trade));
            });

            const { result } = renderUseSellFlow();

            await act(async () => {
                await result.current.doBankAccountVerificationCheck();
            });

            expect(dispatchSpy).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'handleTradeThunkMock',
                }),
            );
        });

        it('should not call doSellTrade if selectedQuote is missing', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');

            act(() => {
                store.dispatch(tradingSellActions.setTradingAccountKey(btc1AccountKey));
                store.dispatch(tradingSellActions.saveSelectedQuote(undefined));
            });

            const { result } = renderUseSellFlow();

            await act(async () => {
                await result.current.doBankAccountVerificationCheck();
            });

            expect(dispatchSpy).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'handleTradeThunkMock',
                }),
            );
        });
    });

    describe('handleBrowser', () => {
        it('should navigate to browser when processResponseData is called with form data', async () => {
            const trade = banxaCreditCardSellQuote;

            act(() => {
                store.dispatch(tradingSellActions.setTradingAccountKey(btc1AccountKey));
                store.dispatch(tradingSellActions.saveSelectedQuote(trade));
            });

            const { result } = renderUseSellFlow();

            await act(async () => {
                await result.current.doSellTrade(trade);
            });

            const mockResponse: SellFiatTradeResponse = {
                tradeForm: {
                    form: {
                        formMethod: 'GET',
                        formAction: 'https://example.com/form',
                        fields: {},
                    },
                },
                trade: {
                    orderId: 'order_id_0',
                    exchange: 'banxa-sell',
                } as SellFiatTrade,
            };

            // Call processResponseData - capturedHandleTradeArgs is set during mock
            expect(capturedHandleTradeArgs).toBeTruthy();
            act(() => {
                capturedHandleTradeArgs!.processResponseData(mockResponse);
            });

            expect(mockOpenBrowserAsync).toHaveBeenCalledTimes(1);
            expect(mockOpenBrowserAsync).toHaveBeenCalledWith(
                'https://example.com/form',
                expect.any(Object),
            );
        });
    });
});
